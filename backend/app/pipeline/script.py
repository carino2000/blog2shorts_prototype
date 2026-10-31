"""③ 대본·장면: LLM 호출·프롬프트·검증. 위반이 있으면 위반 목록을 붙여 1회만 재요청한다."""

import json
import logging
import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Literal

from pydantic import BaseModel, ValidationError

from app.errors import AppError
from app.models import Analysis, Asset, Block, Motion, Scene, Script
from app.providers.llm_base import LlmCallError, LlmProvider

logger = logging.getLogger("blog2shorts")

MIN_SCENES, MAX_SCENES = 4, 6
MIN_CHARS, MAX_CHARS = 210, 400
MIN_KEY_POINTS, MAX_KEY_POINTS = 3, 5
CHARS_PER_SEC = 7  # 🟡 TTS 실측 후 조정

SYSTEM_PROMPT = """너는 블로그 글을 30~60초 세로 숏폼 내레이션으로 바꾸는 작가다.
규칙:
1. 원문에 있는 사실만 쓴다. 원문에 없는 숫자, 이름, 날짜, 효과, 감정을 만들지 않는다.
2. 구성은 Hook 1장면 → 본문 2~4장면 → CTA 1장면, 총 4~6장면.
3. Hook은 첫 3초 안에 시선을 끄는 한 문장. 질문이나 의외의 사실로 시작한다.
4. 홍보 문구는 CTA 장면에서만 쓴다. CTA는 원문 글을 읽으러 오게 하거나 원문이 말하는 행동을 권한다.
5. 장면 문구는 말하듯 짧게, 장면당 30~90자. 전체 210~400자.
6. 각 장면에 근거 블록 ID(sourceBlockIds)를 1개 이상 단다.
7. 각 장면에 어울리는 이미지(assetId)를 아래 목록에서 고른다. 근거 문단과 연결된 이미지를 우선한다. 없으면 null.
8. motion은 zoom_in, zoom_out, pan_left, pan_right, none 중 하나. 연속 장면에 같은 값을 피한다.
9. 대본을 쓰기 전에 원문의 핵심 요약(2~3문장)과 핵심 포인트(3~5개, 각 한 문장)를 analysis에 쓴다. 대본은 이 분석을 바탕으로 쓴다. 요약에도 1번 규칙이 그대로 적용된다.
10. 내레이션과 요약에 "원문", "원문에 소개된", "글에 따르면"처럼 출처를 가리키는 표현을 쓰지 않는다. 사실을 직접 말한다. CTA에서 글을 읽으러 오게 할 때는 "블로그 글"이라고 쓴다.
11. 반드시 지정한 JSON 형식만 출력한다."""

OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["analysis", "script", "scenes"],
    "properties": {
        "analysis": {
            "type": "object",
            "additionalProperties": False,
            "required": ["summary", "keyPoints"],
            "properties": {
                "summary": {"type": "string"},
                "keyPoints": {"type": "array", "items": {"type": "string"}},
            },
        },
        "script": {
            "type": "object",
            "additionalProperties": False,
            "required": ["hook", "body", "cta"],
            "properties": {"hook": {"type": "string"}, "body": {"type": "string"}, "cta": {"type": "string"}},
        },
        "scenes": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["role", "text", "assetId", "motion", "sourceBlockIds"],
                "properties": {
                    "role": {"type": "string", "enum": ["hook", "body", "cta"]},
                    "text": {"type": "string"},
                    "assetId": {"type": ["string", "null"]},
                    "motion": {"type": "string", "enum": ["zoom_in", "zoom_out", "pan_left", "pan_right", "none"]},
                    "sourceBlockIds": {"type": "array", "items": {"type": "string"}},
                },
            },
        },
    },
}


class _OutAnalysis(BaseModel):
    summary: str
    keyPoints: list[str]


class _OutScript(BaseModel):
    hook: str
    body: str
    cta: str


class _OutScene(BaseModel):
    role: Literal["hook", "body", "cta"]
    text: str
    assetId: str | None
    motion: Motion
    sourceBlockIds: list[str]


class LlmOutput(BaseModel):
    analysis: _OutAnalysis
    script: _OutScript
    scenes: list[_OutScene]


@dataclass
class ScriptResult:
    analysis: Analysis
    script: Script
    scenes: list[Scene]


def format_blocks(blocks: list[Block], assets: list[Asset]) -> str:
    lines: list[str] = []
    for block in blocks:
        if block.type == "image":
            caption = block.text or "없음"
            lines.append(f"[{block.id}|image {block.asset_id}] 캡션: {caption} / 연결: {','.join(block.linked_block_ids)}")
        else:
            lines.append(f"[{block.id}|{block.type}] {block.text}")
    listing = ", ".join(asset.id for asset in assets) or "없음(모든 장면의 assetId는 null)"
    return "원문 블록:\n" + "\n".join(lines) + f"\n\n쓸 수 있는 이미지 assetId 목록: {listing}"


def numbers_in(text: str) -> set[str]:
    """숫자 토큰. 전각 숫자는 반각으로, 천 단위 쉼표는 빼서 비교한다."""
    normalized = unicodedata.normalize("NFKC", text)
    return {token.replace(",", "") for token in re.findall(r"\d+(?:[.,]\d+)*", normalized)}


def validate_output(output: LlmOutput, blocks: list[Block], assets: list[Asset]) -> list[str]:
    violations: list[str] = []
    if not output.analysis.summary.strip():
        violations.append("analysis.summary가 비어 있다")
    if not MIN_KEY_POINTS <= len(output.analysis.keyPoints) <= MAX_KEY_POINTS:
        violations.append(f"keyPoints는 {MIN_KEY_POINTS}~{MAX_KEY_POINTS}개여야 한다(현재 {len(output.analysis.keyPoints)}개)")

    scenes = output.scenes
    if not MIN_SCENES <= len(scenes) <= MAX_SCENES:
        violations.append(f"장면은 {MIN_SCENES}~{MAX_SCENES}개여야 한다(현재 {len(scenes)}개)")
    if scenes:
        if scenes[0].role != "hook":
            violations.append("첫 장면의 role은 hook이어야 한다")
        if scenes[-1].role != "cta":
            violations.append("마지막 장면의 role은 cta여야 한다")
        if any(scene.role != "body" for scene in scenes[1:-1]):
            violations.append("가운데 장면의 role은 모두 body여야 한다")

    total = sum(len(scene.text) for scene in scenes)
    if not MIN_CHARS <= total <= MAX_CHARS:
        violations.append(f"장면 문구 전체는 {MIN_CHARS}~{MAX_CHARS}자여야 한다(현재 {total}자)")

    asset_ids = {asset.id for asset in assets}
    block_ids = {block.id for block in blocks}
    source_numbers = numbers_in(" ".join(block.text or "" for block in blocks))
    for order, scene in enumerate(scenes, start=1):
        if scene.assetId is not None and scene.assetId not in asset_ids:
            violations.append(f"장면 {order}: 없는 assetId {scene.assetId}")
        if not scene.sourceBlockIds:
            violations.append(f"장면 {order}: sourceBlockIds가 비어 있다")
        missing = [block_id for block_id in scene.sourceBlockIds if block_id not in block_ids]
        if missing:
            violations.append(f"장면 {order}: 없는 sourceBlockIds {missing}")
        invented = numbers_in(scene.text) - source_numbers
        if invented:
            violations.append(f"장면 {order}: 원문에 없는 숫자 {sorted(invented)}")

    written = " ".join([output.analysis.summary, *output.analysis.keyPoints,
                        output.script.hook, output.script.body, output.script.cta])
    invented = numbers_in(written) - source_numbers
    if invented:
        violations.append(f"요약·대본: 원문에 없는 숫자 {sorted(invented)}")
    return violations


def _to_result(output: LlmOutput) -> ScriptResult:
    scenes = [
        Scene(id=f"s{order}", order=order, role=scene.role, text=scene.text, asset_id=scene.assetId,
              motion=scene.motion, source_block_ids=scene.sourceBlockIds, duration_sec=None, subtitles=[])
        for order, scene in enumerate(output.scenes, start=1)
    ]
    total = sum(len(scene.text) for scene in scenes)
    return ScriptResult(
        analysis=Analysis(summary=output.analysis.summary, key_points=output.analysis.keyPoints),
        script=Script(hook=output.script.hook, body=output.script.body, cta=output.script.cta,
                      estimated_sec=round(total / CHARS_PER_SEC, 1)),
        scenes=scenes,
    )


async def generate_script(llm: LlmProvider, blocks: list[Block], assets: list[Asset]) -> ScriptResult:
    user = format_blocks(blocks, assets)
    prompt = user
    violations: list[str] = []
    for attempt in (1, 2):
        try:
            result = await llm.generate_json(SYSTEM_PROMPT, prompt, OUTPUT_SCHEMA, "shorts_script")
        except LlmCallError as error:
            # 호출 자체의 실패는 재요청하지 않는다(잔액 부족을 되풀이하지 않기 위해)
            raise AppError("LLM_FAILED") from error
        logger.info("LLM 호출 %d회차 %s: 입력 %d 토큰, 출력 %d 토큰",
                    attempt, result.model, result.input_tokens, result.output_tokens)
        try:
            output = LlmOutput.model_validate(json.loads(result.text))
        except (json.JSONDecodeError, ValidationError) as error:
            violations = [f"JSON 형식 오류: {type(error).__name__}"]
        else:
            violations = validate_output(output, blocks, assets)
            if not violations:
                return _to_result(output)
        logger.warning("LLM 출력 위반 %d회차: %s", attempt, violations)
        prompt = (f"{user}\n\n직전 출력:\n{result.text}\n\n"
                  "직전 출력은 아래 규칙을 어겼다. 고쳐서 전체 JSON을 다시 출력하라:\n- " + "\n- ".join(violations))
    raise AppError("LLM_FAILED")

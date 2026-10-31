import json

import pytest

from app.errors import AppError
from app.models import Asset, Block
from app.pipeline import relate, script
from app.providers.llm_base import LlmCallError, LlmResult


def _block(block_id: str, kind: str, text: str | None = None, asset_id: str | None = None) -> Block:
    return Block(id=block_id, type=kind, text=text, asset_id=asset_id, linked_block_ids=[])


BLOCKS = [
    _block("b1", "heading", "제목"),
    _block("b2", "paragraph", "수강료는 160,000원이고 73강으로 구성됩니다."),
    _block("b3", "image", None, "a1"),
    _block("b4", "paragraph", "１. 기본 개념부터 공부합니다."),
]
ASSETS = [Asset(id="a1", origin="blog", url="/api/assets/a1", width=966, height=724)]


def good_output() -> dict:
    sentence = "기본 개념부터 차근차근 공부하면 시험 준비가 훨씬 수월해진다고 원문은 설명하고 있어요. "
    return {
        "analysis": {"summary": "요약 문장이다.", "keyPoints": ["하나", "둘", "셋"]},
        "script": {"hook": "훅", "body": "본문", "cta": "행동"},
        "scenes": [
            {"role": "hook", "text": "73강 강의가 궁금한가요? " + sentence, "assetId": "a1", "motion": "zoom_in", "sourceBlockIds": ["b2"]},
            {"role": "body", "text": "수강료는 160,000원입니다. " + sentence, "assetId": "a1", "motion": "pan_left", "sourceBlockIds": ["b2"]},
            {"role": "body", "text": sentence, "assetId": None, "motion": "zoom_out", "sourceBlockIds": ["b4"]},
            {"role": "cta", "text": "원문에서 확인해 보세요. " + sentence, "assetId": "a1", "motion": "none", "sourceBlockIds": ["b4"]},
        ],
    }


def violations(output: dict) -> list[str]:
    return script.validate_output(script.LlmOutput.model_validate(output), BLOCKS, ASSETS)


class FakeLlm:
    def __init__(self, *responses: dict | str | Exception) -> None:
        self.responses = list(responses)
        self.prompts: list[str] = []

    async def generate_json(self, system, user, schema, schema_name) -> LlmResult:
        self.prompts.append(user)
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        text = response if isinstance(response, str) else json.dumps(response, ensure_ascii=False)
        return LlmResult(text=text, model="fake", input_tokens=1, output_tokens=1)


def test_validator_accepts_good_output() -> None:
    assert violations(good_output()) == []


def test_validator_scene_count() -> None:
    output = good_output()
    output["scenes"] = output["scenes"][:1] + output["scenes"][-1:]
    assert any("장면은 4~6개" in item for item in violations(output))


def test_validator_roles() -> None:
    output = good_output()
    output["scenes"][0]["role"] = "body"
    output["scenes"][-1]["role"] = "body"
    found = violations(output)
    assert any("hook" in item for item in found) and any("cta" in item for item in found)


def test_validator_total_chars() -> None:
    output = good_output()
    for scene in output["scenes"]:
        scene["text"] = "짧다"
    assert any("210~400자" in item for item in violations(output))


def test_validator_unknown_ids() -> None:
    output = good_output()
    output["scenes"][0]["assetId"] = "a99"
    output["scenes"][1]["sourceBlockIds"] = ["b99"]
    output["scenes"][2]["sourceBlockIds"] = []
    found = violations(output)
    assert any("a99" in item for item in found)
    assert any("b99" in item for item in found)
    assert any("비어 있다" in item for item in found)


def test_validator_invented_number_in_scene() -> None:
    output = good_output()
    output["scenes"][1]["text"] += " 합격률은 95%입니다."
    assert any("장면 2: 원문에 없는 숫자 ['95']" in item for item in violations(output))


def test_validator_invented_number_in_summary() -> None:
    output = good_output()
    output["analysis"]["summary"] = "3개월이면 합격한다."
    assert any("요약·대본" in item for item in violations(output))


def test_validator_key_points_and_summary() -> None:
    output = good_output()
    output["analysis"] = {"summary": " ", "keyPoints": ["하나"]}
    found = violations(output)
    assert any("summary" in item for item in found) and any("keyPoints" in item for item in found)


def test_numbers_normalize_commas_and_fullwidth() -> None:
    assert script.numbers_in("１. 160,000원 2.5배") == {"1", "160000", "2.5"}


@pytest.mark.asyncio
async def test_generate_success_builds_scenes() -> None:
    result = await script.generate_script(FakeLlm(good_output()), BLOCKS, ASSETS)
    assert [scene.id for scene in result.scenes] == ["s1", "s2", "s3", "s4"]
    assert result.scenes[0].duration_sec is None
    total = sum(len(scene.text) for scene in result.scenes)
    assert result.script.estimated_sec == round(total / 7, 1)


@pytest.mark.asyncio
async def test_generate_retries_once_with_violations() -> None:
    bad = good_output()
    bad["scenes"][1]["text"] += " 95%"
    llm = FakeLlm(bad, good_output())
    await script.generate_script(llm, BLOCKS, ASSETS)
    assert len(llm.prompts) == 2
    assert "원문에 없는 숫자" in llm.prompts[1]


@pytest.mark.asyncio
async def test_generate_fails_after_second_violation() -> None:
    llm = FakeLlm("JSON 아님", "여전히 아님", good_output())
    with pytest.raises(AppError) as error:
        await script.generate_script(llm, BLOCKS, ASSETS)
    assert error.value.code == "LLM_FAILED"
    assert len(llm.prompts) == 2


@pytest.mark.asyncio
async def test_call_error_is_not_retried() -> None:
    llm = FakeLlm(LlmCallError("HTTP 429 insufficient_quota"), good_output())
    with pytest.raises(AppError) as error:
        await script.generate_script(llm, BLOCKS, ASSETS)
    assert error.value.code == "LLM_FAILED"
    assert len(llm.prompts) == 1


def test_link_images_before_after_and_heading() -> None:
    blocks = [
        _block("b1", "paragraph", "앞"),
        _block("b2", "heading", "소제목"),
        _block("b3", "image", None, "a1"),
        _block("b4", "image", None, "a2"),
        _block("b5", "paragraph", "뒤"),
        _block("b6", "image", None, "a3"),
    ]
    linked = relate.link_images(blocks)
    assert linked[2].linked_block_ids == ["b1", "b2", "b5"]
    assert linked[5].linked_block_ids == ["b5"]
    assert blocks[2].linked_block_ids == []

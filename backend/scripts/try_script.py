"""작업4: samples/extract JSON으로 실제 LLM을 불러 samples/script/에 저장한다. 비용 발생.

    .venv/Scripts/python scripts/try_script.py <logNo> [<logNo> ...]

호출 수·토큰은 출력과 samples/script/usage.jsonl에 남긴다. 호출이 실패하면 나머지를 돌리지 않고 멈춘다.
"""

import asyncio
import json
import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.errors import AppError  # noqa: E402
from app.models import Asset, Block  # noqa: E402
from app.pipeline import relate, script  # noqa: E402
from app.providers.llm_base import LlmResult, get_llm_provider  # noqa: E402

EXTRACT_DIR = BACKEND_DIR / "samples" / "extract"
OUT_DIR = BACKEND_DIR / "samples" / "script"


class CountingLlm:
    def __init__(self, inner) -> None:
        self.inner = inner
        self.calls: list[LlmResult] = []

    async def generate_json(self, system, user, schema, schema_name) -> LlmResult:
        result = await self.inner.generate_json(system, user, schema, schema_name)
        self.calls.append(result)
        return result


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for log_no in sys.argv[1:]:
        data = json.loads(next(EXTRACT_DIR.glob(f"*_{log_no}.json")).read_text(encoding="utf-8"))
        blocks = relate.link_images([Block.model_validate(item) for item in data["blocks"]])
        assets = [Asset.model_validate(item) for item in data["assets"]]
        llm = CountingLlm(get_llm_provider())
        try:
            result = await script.generate_script(llm, blocks, assets)
            error = None
        except AppError as app_error:
            result, error = None, app_error.code
        usage = [{"model": c.model, "input": c.input_tokens, "output": c.output_tokens} for c in llm.calls]
        with (OUT_DIR / "usage.jsonl").open("a", encoding="utf-8") as file:
            file.write(json.dumps({"logNo": log_no, "error": error, "calls": usage}) + "\n")
        print(log_no, "호출", usage, "오류", error)
        if result is None:
            if not llm.calls:
                raise SystemExit("호출 자체가 실패해서 멈춥니다. 위 로그를 확인하세요.")
            continue
        source_numbers = script.numbers_in(" ".join(block.text or "" for block in blocks))
        written = " ".join([result.analysis.summary, *result.analysis.key_points, *(s.text for s in result.scenes)])
        out = {
            "title": data["title"],
            "totalChars": sum(len(s.text) for s in result.scenes),
            "inventedNumbers": sorted(script.numbers_in(written) - source_numbers),
            "analysis": result.analysis.model_dump(mode="json"),
            "script": result.script.model_dump(mode="json"),
            "scenes": [s.model_dump(mode="json") for s in result.scenes],
        }
        (OUT_DIR / f"{log_no}.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  {out['title'][:40]} 장면 {len(out['scenes'])}, {out['totalChars']}자, 없는 숫자 {out['inventedNumbers']}")
        for scene in result.scenes:
            print(f"   {scene.role:5}{re.sub(r'\s+', ' ', scene.text)} [{scene.motion}] {scene.source_block_ids}")


if __name__ == "__main__":
    asyncio.run(main())

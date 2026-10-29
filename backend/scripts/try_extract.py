"""작업4: 네이버 글 URL을 넣고 blocks JSON을 samples/extract/에 저장한다.

    .venv/Scripts/python scripts/try_extract.py                      # samples/extract/urls.txt 전부
    .venv/Scripts/python scripts/try_extract.py <URL> [<URL> ...]
    .venv/Scripts/python scripts/try_extract.py --save-html <URL>    # HTML을 tests/fixtures/naver_html/에도 저장

이미지는 data/try_extract/{logNo}/에 내려받는다(커밋하지 않음).
"""

import argparse
import asyncio
import itertools
import json
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import get_settings  # noqa: E402
from app.errors import AppError  # noqa: E402
from app.pipeline import naver  # noqa: E402

SAMPLES_DIR = BACKEND_DIR / "samples" / "extract"
FIXTURES_DIR = BACKEND_DIR / "tests" / "fixtures" / "naver_html"


async def run_one(client, url: str, save_html: bool) -> dict:
    started = time.perf_counter()
    try:
        post = naver.parse_naver_url(url)
    except AppError as error:
        return {"url": url, "ok": False, "error": error.code}

    if save_html:
        html, _ = await naver.fetch_post(client, post)
        FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
        (FIXTURES_DIR / f"{post.blog_id}_{post.log_no}.html").write_text(html, encoding="utf-8")

    counter = itertools.count(1)
    assets_dir = get_settings().data_dir / "try_extract" / post.log_no
    try:
        result = await naver.extract(client, url, assets_dir, lambda: f"a{next(counter)}")
    except AppError as error:
        return {"url": url, "ok": False, "error": error.code}

    summary = {
        "url": url,
        "ok": True,
        "seconds": round(time.perf_counter() - started, 2),
        "title": result.title,
        "counts": {
            kind: sum(1 for block in result.blocks if block.type == kind)
            for kind in ("heading", "paragraph", "image")
        },
        "textChars": sum(len(block.text or "") for block in result.blocks if block.type != "image"),
        "skippedImages": result.skipped_images,
        "skippedComponents": result.skipped_components,
        "assets": [asset.model_dump(mode="json") for asset, _ in result.assets],
        "blocks": [block.model_dump(mode="json") for block in result.blocks],
    }
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    (SAMPLES_DIR / f"{post.blog_id}_{post.log_no}.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return summary


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("urls", nargs="*")
    parser.add_argument("--save-html", action="store_true")
    args = parser.parse_args()
    urls = args.urls or [
        line.strip() for line in (SAMPLES_DIR / "urls.txt").read_text(encoding="utf-8").splitlines() if line.strip()
    ]

    async with naver.new_client() as client:
        for url in urls:
            summary = await run_one(client, url, args.save_html)
            if summary["ok"]:
                counts = summary["counts"]
                print(f"OK   {url}  {summary['seconds']}s  제목={summary['title']!r:.40}  "
                      f"h{counts['heading']} p{counts['paragraph']} i{counts['image']}  "
                      f"글자 {summary['textChars']}  이미지 건너뜀 {len(summary['skippedImages'])}")
            else:
                print(f"FAIL {url}  {summary['error']}")


if __name__ == "__main__":
    asyncio.run(main())

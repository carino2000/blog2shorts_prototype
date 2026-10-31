import json
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.pipeline import naver
from app.providers.llm_base import LlmCallError, LlmResult, get_llm_provider
from app.store import ProjectStore, get_store


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line("markers", "external: 실제 외부 API를 부르는 테스트(비용 발생). `-m external`로만 실행")


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    # -m 으로 external을 직접 고르지 않으면 건너뛴다(예산 보호)
    if "external" in (config.option.markexpr or ""):
        return
    skip = pytest.mark.skip(reason="external 테스트는 `pytest -m external`로만 실행")
    for item in items:
        if "external" in item.keywords:
            item.add_marker(skip)


VALID_TEXT = "기본 개념부터 공부합니다. 수강료는 160,000원이고 73강입니다. " * 8


def script_json() -> str:
    """VALID_TEXT 기준으로 검증을 통과하는 LLM 출력."""
    sentence = "기본 개념부터 차근차근 공부하면 준비가 훨씬 수월해진다고 원문은 설명하고 있어요. "
    return json.dumps({
        "analysis": {"summary": "요약이다.", "keyPoints": ["하나", "둘", "셋"]},
        "script": {"hook": "훅", "body": "본문", "cta": "행동"},
        "scenes": [
            {"role": "hook", "text": "73강 강의가 궁금한가요? " + sentence, "assetId": None, "motion": "zoom_in", "sourceBlockIds": ["b1"]},
            {"role": "body", "text": "수강료는 160,000원입니다. " + sentence, "assetId": None, "motion": "pan_left", "sourceBlockIds": ["b1"]},
            {"role": "body", "text": sentence, "assetId": None, "motion": "zoom_out", "sourceBlockIds": ["b1"]},
            {"role": "cta", "text": "원문에서 확인해 보세요. " + sentence, "assetId": None, "motion": "none", "sourceBlockIds": ["b1"]},
        ],
    }, ensure_ascii=False)


class FakeLlm:
    def __init__(self) -> None:
        self.calls = 0
        self.fail = False

    async def generate_json(self, system, user, schema, schema_name) -> LlmResult:
        self.calls += 1
        if self.fail:
            raise LlmCallError("가짜 실패")
        return LlmResult(text=script_json(), model="fake", input_tokens=1, output_tokens=1)


@pytest.fixture
def llm() -> FakeLlm:
    return FakeLlm()


@pytest.fixture
def store(tmp_path, llm) -> Iterator[ProjectStore]:
    test_store = ProjectStore(tmp_path)
    app.dependency_overrides[get_store] = lambda: test_store
    app.dependency_overrides[get_llm_provider] = lambda: llm
    yield test_store
    app.dependency_overrides.clear()


@pytest.fixture
def client(store) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def fake_extract(monkeypatch, store):
    """네트워크 없이 이미지 3장짜리 글을 추출한 것처럼 만든다."""
    from PIL import Image

    from app.models import Asset, Block

    async def extract(client, raw_url, assets_dir, new_asset_id):
        assets_dir.mkdir(parents=True, exist_ok=True)
        assets = []
        for _ in range(3):
            asset_id = new_asset_id()
            path = assets_dir / f"{asset_id}.jpg"
            Image.new("RGB", (800, 600), (10, 20, 30)).save(path, "JPEG")
            assets.append((Asset(id=asset_id, origin="blog", url=f"/api/assets/{asset_id}", width=800, height=600), path))
        blocks = [
            Block(id="b1", type="paragraph", text=VALID_TEXT, asset_id=None, linked_block_ids=[]),
            Block(id="b2", type="image", text=None, asset_id=assets[0][0].id, linked_block_ids=[]),
        ]
        return naver.ExtractResult("글 제목", blocks, assets, [])

    monkeypatch.setattr(naver, "extract", extract)

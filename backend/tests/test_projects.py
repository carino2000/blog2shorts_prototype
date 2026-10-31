from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient

from app.pipeline import naver
from app.store import ProjectStore
from tests.conftest import VALID_TEXT

URL = "https://blog.naver.com/abc/123"

# 통합기획서 6-1 필드 목록 (계약 대조용)
CONTRACT_FIELDS = {
    "Project": {"id", "status", "progress", "error", "source", "assets", "needsUpload", "analysis",
                "script", "scenes", "video", "createdAt"},
    "Source": {"type", "url", "title", "blocks"},
    "Block": {"id", "type", "text", "assetId", "linkedBlockIds"},
    "Asset": {"id", "origin", "url", "width", "height"},
    "Analysis": {"summary", "keyPoints"},
    "Script": {"hook", "body", "cta", "estimatedSec"},
    "Scene": {"id", "order", "role", "text", "assetId", "motion", "sourceBlockIds", "durationSec", "subtitles"},
    "Subtitle": {"startSec", "endSec", "text"},
    "Video": {"url", "durationSec", "width", "height", "fps"},
    "Progress": {"stage", "percent", "message"},
    "ProjectError": {"stage", "code", "message"},
}


def create(client: TestClient, body: dict) -> dict:
    response = client.post("/api/projects", json=body)
    assert response.status_code == 202
    # TestClient는 응답 뒤 백그라운드 작업을 끝까지 돌린다
    return client.get(f"/api/projects/{response.json()['id']}").json()


def test_url_project_reaches_ready(client: TestClient, fake_extract) -> None:
    project = create(client, {"type": "url", "url": URL})
    assert project["status"] == "ready"
    assert project["source"]["title"] == "글 제목"
    assert project["needsUpload"] is False
    assert project["analysis"]["keyPoints"]
    assert all(scene["assetId"] for scene in project["scenes"])  # LLM이 null을 줘도 ④가 채운다
    assert len({scene["assetId"] for scene in project["scenes"]}) == 3
    image = next(block for block in project["source"]["blocks"] if block["type"] == "image")
    assert image["linkedBlockIds"] == ["b1"]  # ②


def test_text_project_needs_upload(client: TestClient) -> None:
    project = create(client, {"type": "text", "text": VALID_TEXT})
    assert project["status"] == "ready"
    assert project["needsUpload"] is True
    assert project["source"]["title"] is None
    assert all(scene["assetId"] is None for scene in project["scenes"])


def test_status_transitions_in_order(store: ProjectStore, client: TestClient, fake_extract, monkeypatch) -> None:
    statuses: list[str] = []
    original_update = store.update

    async def recording_update(project_id: str, change: Callable) -> object:
        project = await original_update(project_id, change)
        if not statuses or statuses[-1] != project.status:
            statuses.append(project.status)
        return project

    monkeypatch.setattr(store, "update", recording_update)
    client.post("/api/projects", json={"type": "url", "url": URL})
    assert statuses == ["extracting", "scripting", "ready"]


def test_assets_are_served(client: TestClient, fake_extract) -> None:
    project = create(client, {"type": "url", "url": URL})
    response = client.get(project["assets"][0]["url"])
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"


def test_bad_url_is_400(client: TestClient) -> None:
    response = client.post("/api/projects", json={"type": "url", "url": "https://tistory.com/a/1"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "NOT_NAVER_URL"


def test_short_text_is_400(client: TestClient) -> None:
    response = client.post("/api/projects", json={"type": "text", "text": "짧음"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "TEXT_TOO_SHORT"


@pytest.mark.parametrize("code", ["POST_NOT_FOUND", "EXTRACT_FAILED"])
def test_extract_failure_is_recorded(client: TestClient, monkeypatch, llm, code: str) -> None:
    async def extract(*_args):
        raise naver.AppError(code)

    monkeypatch.setattr(naver, "extract", extract)
    project = create(client, {"type": "url", "url": URL})
    assert project["status"] == "error"
    assert project["error"]["stage"] == "extract"
    assert project["error"]["code"] == code
    assert llm.calls == 0


def test_unexpected_extract_error_is_recorded(client: TestClient, monkeypatch) -> None:
    async def extract(*_args):
        raise RuntimeError("파서 깨짐")

    monkeypatch.setattr(naver, "extract", extract)
    project = create(client, {"type": "url", "url": URL})
    assert project["error"]["code"] == "EXTRACT_FAILED"


def test_llm_failure_then_regenerate_without_script(client: TestClient, llm) -> None:
    llm.fail = True
    project = create(client, {"type": "text", "text": VALID_TEXT})
    assert project["status"] == "error"
    assert project["error"] == {"stage": "script", "code": "LLM_FAILED", "message": project["error"]["message"]}
    assert project["script"] is None

    llm.fail = False
    response = client.post(f"/api/projects/{project['id']}/regenerate")
    assert response.status_code == 202
    project = client.get(f"/api/projects/{project['id']}").json()
    assert project["status"] == "ready"
    assert project["error"] is None
    assert project["script"] is not None


def test_regenerate_failure_keeps_previous_script(client: TestClient, llm) -> None:
    project = create(client, {"type": "text", "text": VALID_TEXT})
    before = project["scenes"]
    llm.fail = True
    client.post(f"/api/projects/{project['id']}/regenerate")
    project = client.get(f"/api/projects/{project['id']}").json()
    assert project["status"] == "error"
    assert project["scenes"] == before


def test_regenerate_without_blocks_is_409(client: TestClient, monkeypatch) -> None:
    async def extract(*_args):
        raise naver.AppError("EXTRACT_FAILED")

    monkeypatch.setattr(naver, "extract", extract)
    project = create(client, {"type": "url", "url": URL})
    response = client.post(f"/api/projects/{project['id']}/regenerate")
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "INVALID_STATE"


def test_unknown_project_returns_404_error_format(client: TestClient) -> None:
    response = client.get("/api/projects/nope")
    assert response.status_code == 404
    assert response.json() == {"error": {"code": "NOT_FOUND", "message": "작업이 만료되었습니다. 처음부터 다시 시작해 주세요."}}


def test_unknown_asset_returns_404_error_format(client: TestClient) -> None:
    response = client.get("/api/assets/nope")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


@pytest.mark.parametrize("body", [{}, {"type": "url"}, {"type": "video", "url": "x"}, {"type": "text"}])
def test_invalid_body_returns_error_format(client: TestClient, body: dict) -> None:
    response = client.post("/api/projects", json=body)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REQUEST"


def test_unknown_route_returns_error_format(client: TestClient) -> None:
    response = client.get("/api/nothing-here")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_openapi_fields_match_contract(client: TestClient) -> None:
    schemas = client.get("/openapi.json").json()["components"]["schemas"]
    # 응답(직렬화) 스키마 이름은 FastAPI가 "-Output"을 붙일 수 있다
    for name, fields in CONTRACT_FIELDS.items():
        schema = schemas.get(name) or schemas[f"{name}-Output"]
        assert set(schema["properties"]) == fields, name

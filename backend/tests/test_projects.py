import re
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.pipeline import runner
from app.store import ProjectStore, get_store

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


@pytest.fixture
def store(tmp_path, monkeypatch) -> Iterator[ProjectStore]:
    monkeypatch.setattr(runner, "FAKE_STEP_SEC", 0)
    test_store = ProjectStore(tmp_path)
    app.dependency_overrides[get_store] = lambda: test_store
    yield test_store
    app.dependency_overrides.clear()


@pytest.fixture
def client(store) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


def test_create_url_project_reaches_ready(client: TestClient) -> None:
    response = client.post("/api/projects", json={"type": "url", "url": "https://blog.naver.com/abc/123"})
    assert response.status_code == 202
    project_id = response.json()["id"]

    # TestClient는 응답 뒤 백그라운드 작업을 끝까지 돌린다
    project = client.get(f"/api/projects/{project_id}").json()
    assert project["status"] == "ready"
    assert project["source"]["url"] == "https://blog.naver.com/abc/123"
    assert project["error"] is None
    assert project["progress"] is None
    assert project["analysis"]["summary"]
    assert 3 <= len(project["analysis"]["keyPoints"]) <= 5
    assert 4 <= len(project["scenes"]) <= 6
    assert project["scenes"][0]["role"] == "hook"
    assert project["scenes"][-1]["role"] == "cta"


def test_sample_script_follows_script_rules(client: TestClient) -> None:
    project_id = client.post("/api/projects", json={"type": "text", "text": "본문"}).json()["id"]
    project = client.get(f"/api/projects/{project_id}").json()

    assert project["source"]["type"] == "text"
    total = sum(len(scene["text"]) for scene in project["scenes"])
    assert 210 <= total <= 400
    asset_ids = {asset["id"] for asset in project["assets"]}
    block_ids = {block["id"] for block in project["source"]["blocks"]}
    source_text = " ".join(block["text"] or "" for block in project["source"]["blocks"])
    source_numbers = set(re.findall(r"\d+", source_text))
    for scene in project["scenes"]:
        assert scene["assetId"] in asset_ids
        assert set(scene["sourceBlockIds"]) <= block_ids
        assert set(re.findall(r"\d+", scene["text"])) <= source_numbers


def test_status_transitions_in_order(store: ProjectStore, client: TestClient, monkeypatch) -> None:
    statuses: list[str] = []
    original_update = store.update

    async def recording_update(project_id, change):
        project = await original_update(project_id, change)
        if not statuses or statuses[-1] != project.status:
            statuses.append(project.status)
        return project

    monkeypatch.setattr(store, "update", recording_update)
    client.post("/api/projects", json={"type": "url", "url": "https://blog.naver.com/abc/123"})
    assert statuses == ["extracting", "scripting", "ready"]


def test_assets_are_served(client: TestClient) -> None:
    project_id = client.post("/api/projects", json={"type": "url", "url": "https://blog.naver.com/a/1"}).json()["id"]
    assets = client.get(f"/api/projects/{project_id}").json()["assets"]
    assert len(assets) == 3
    response = client.get(assets[0]["url"])
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"


def test_asset_ids_are_unique_across_projects(client: TestClient) -> None:
    ids: set[str] = set()
    for _ in range(2):
        project_id = client.post("/api/projects", json={"type": "url", "url": "https://blog.naver.com/a/1"}).json()["id"]
        ids |= {asset["id"] for asset in client.get(f"/api/projects/{project_id}").json()["assets"]}
    assert len(ids) == 6


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
    error = response.json()["error"]
    assert error["code"] == "INVALID_REQUEST"
    assert error["message"]


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

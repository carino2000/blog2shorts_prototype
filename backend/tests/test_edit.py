import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.models import Subtitle, Video
from app.pipeline import naver
from app.store import ProjectStore
from tests.conftest import VALID_TEXT

URL = "https://blog.naver.com/abc/123"


def image_bytes(fmt: str = "PNG") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (320, 240), (1, 2, 3)).save(buffer, fmt)
    return buffer.getvalue()


@pytest.fixture
def project(client: TestClient, fake_extract) -> dict:
    project_id = client.post("/api/projects", json={"type": "url", "url": URL}).json()["id"]
    return client.get(f"/api/projects/{project_id}").json()


async def _set_rendered(store: ProjectStore, project_id: str) -> None:
    def change(target) -> None:
        target.status = "done"
        target.video = Video(url="/x", duration_sec=10)
        for scene in target.scenes:
            scene.duration_sec = 3.0
            scene.subtitles = [Subtitle(start_sec=0, end_sec=3, text="자막")]
    await store.update(project_id, change)


def patch(client: TestClient, project_id: str, *scenes: dict):
    return client.patch(f"/api/projects/{project_id}/scenes", json={"scenes": list(scenes)})


def test_text_change_resets_only_that_scene(client, store, project) -> None:
    client.portal.call(_set_rendered, store, project["id"])
    response = patch(client, project["id"], {"id": "s1", "text": "새 문구"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready" and body["video"] is None
    assert body["scenes"][0]["text"] == "새 문구"
    assert body["scenes"][0]["durationSec"] is None and body["scenes"][0]["subtitles"] == []
    assert body["scenes"][1]["durationSec"] == 3.0 and body["scenes"][1]["subtitles"]


def test_asset_and_motion_change_keeps_duration(client, store, project) -> None:
    client.portal.call(_set_rendered, store, project["id"])
    other = project["assets"][2]["id"]
    body = patch(client, project["id"], {"id": "s1", "assetId": other, "motion": "none"}).json()
    assert body["scenes"][0]["assetId"] == other and body["scenes"][0]["motion"] == "none"
    assert body["scenes"][0]["durationSec"] == 3.0
    assert body["video"] is None and body["status"] == "ready"


def test_same_values_change_nothing(client, store, project) -> None:
    client.portal.call(_set_rendered, store, project["id"])
    scene = project["scenes"][0]
    body = patch(client, project["id"], {"id": "s1", "text": scene["text"]}).json()
    assert body["status"] == "done" and body["video"] is not None


def test_unknown_asset_is_missing_image_and_nothing_changes(client, project) -> None:
    response = patch(client, project["id"], {"id": "s1", "text": "바뀌면 안 됨"}, {"id": "s2", "assetId": "a999"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "MISSING_IMAGE"
    assert client.get(f"/api/projects/{project['id']}").json()["scenes"][0]["text"] != "바뀌면 안 됨"


def test_null_asset_is_missing_image(client, project) -> None:
    assert patch(client, project["id"], {"id": "s1", "assetId": None}).json()["error"]["code"] == "MISSING_IMAGE"


@pytest.mark.parametrize("scene", [{"id": "s99", "text": "x"}, {"id": "s1", "text": "  "}, {"id": "s1", "motion": "spin"}])
def test_bad_scene_is_invalid_request(client, project, scene: dict) -> None:
    response = patch(client, project["id"], scene)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REQUEST"


def test_patch_while_rendering_is_409(client, store, project) -> None:
    async def rendering() -> None:
        def change(target) -> None:
            target.status = "rendering"
        await store.update(project["id"], change)

    client.portal.call(rendering)
    response = patch(client, project["id"], {"id": "s1", "text": "새 문구"})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "INVALID_STATE"


def test_patch_unknown_project_is_404(client) -> None:
    assert patch(client, "nope", {"id": "s1", "text": "x"}).status_code == 404


@pytest.mark.parametrize("fmt,mime", [("JPEG", "image/jpeg"), ("PNG", "image/png"), ("WEBP", "image/webp")])
def test_upload_and_use_on_text_project(client, fmt: str, mime: str) -> None:
    project_id = client.post("/api/projects", json={"type": "text", "text": VALID_TEXT}).json()["id"]
    response = client.post(f"/api/projects/{project_id}/assets", files={"file": ("a.img", image_bytes(fmt), mime)})
    assert response.status_code == 201
    asset = response.json()
    assert asset["origin"] == "upload" and (asset["width"], asset["height"]) == (320, 240)
    assert client.get(asset["url"]).headers["content-type"] == mime
    body = patch(client, project_id, {"id": "s1", "assetId": asset["id"]}).json()
    assert body["scenes"][0]["assetId"] == asset["id"]
    assert body["needsUpload"] is True


def test_upload_rejects_non_image_gif_and_big_file(client, monkeypatch) -> None:
    project_id = client.post("/api/projects", json={"type": "text", "text": VALID_TEXT}).json()["id"]
    url = f"/api/projects/{project_id}/assets"
    for data in (b"hello", image_bytes("GIF")):
        response = client.post(url, files={"file": ("a.png", data, "image/png")})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "UPLOAD_INVALID"
    monkeypatch.setattr(naver, "MAX_IMAGE_BYTES", 10)
    response = client.post(url, files={"file": ("a.png", image_bytes(), "image/png")})
    assert response.json()["error"]["code"] == "UPLOAD_INVALID"


def test_upload_to_unknown_project_is_404(client) -> None:
    response = client.post("/api/projects/nope/assets", files={"file": ("a.png", image_bytes(), "image/png")})
    assert response.status_code == 404

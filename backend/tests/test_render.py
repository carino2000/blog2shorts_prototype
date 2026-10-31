"""가짜 TTS(ffmpeg 사인파 mp3)로 실제 렌더까지 돈다. ffmpeg가 없으면 건너뛴다."""

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.pipeline import runner
from app.providers.tts_base import TtsCallError, get_tts_provider

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg 없음")
URL = "https://blog.naver.com/abc/123"


class FakeTts:
    name = "fake"
    model = "m"
    voice = "v"

    def __init__(self) -> None:
        self.calls = 0
        self.fail = False

    async def synthesize(self, text: str) -> bytes:
        self.calls += 1
        if self.fail:
            raise TtsCallError("가짜 실패")
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "a.mp3"
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1",
                            "-c:a", "libmp3lame", str(path)], check=True)
            return path.read_bytes()


@pytest.fixture
def tts(client: TestClient):
    provider = FakeTts()
    app.dependency_overrides[get_tts_provider] = lambda: provider
    return provider


@pytest.fixture
def project_id(client: TestClient, fake_extract) -> str:
    return client.post("/api/projects", json={"type": "url", "url": URL}).json()["id"]


def get(client: TestClient, project_id: str) -> dict:
    return client.get(f"/api/projects/{project_id}").json()


def test_render_produces_video_and_cache_avoids_tts(client, tts, project_id, store) -> None:
    assert client.post(f"/api/projects/{project_id}/render").status_code == 202
    project = get(client, project_id)
    assert project["status"] == "done", project["error"]
    assert tts.calls == 4
    assert project["video"]["url"] == f"/api/projects/{project_id}/video"
    assert all(scene["durationSec"] and scene["subtitles"] for scene in project["scenes"])

    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,pix_fmt",
         "-of", "json", str(store.paths(project_id).output)], capture_output=True, encoding="utf-8").stdout)["streams"][0]
    assert (probe["width"], probe["height"], probe["r_frame_rate"], probe["pix_fmt"]) == (1080, 1920, "30/1", "yuv420p")

    response = client.get(f"/api/projects/{project_id}/video")
    assert response.headers["content-type"] == "video/mp4"
    assert "attachment" not in response.headers.get("content-disposition", "")
    response = client.get(f"/api/projects/{project_id}/video?download=1")
    assert "attachment" in response.headers["content-disposition"]

    # 다시 렌더: 호출 없음. 한 장면만 고치면 그 장면만
    client.post(f"/api/projects/{project_id}/render")
    assert tts.calls == 4
    client.patch(f"/api/projects/{project_id}/scenes", json={"scenes": [{"id": "s2", "text": "고친 문구입니다."}]})
    assert client.get(f"/api/projects/{project_id}/video").status_code == 404
    client.post(f"/api/projects/{project_id}/render")
    assert tts.calls == 5
    assert get(client, project_id)["status"] == "done"


def test_tts_failure_then_retry(client, tts, project_id) -> None:
    tts.fail = True
    client.post(f"/api/projects/{project_id}/render")
    project = get(client, project_id)
    assert project["status"] == "error"
    assert project["error"]["stage"] == "tts" and project["error"]["code"] == "TTS_FAILED"
    tts.fail = False
    client.post(f"/api/projects/{project_id}/render?from=tts")
    assert get(client, project_id)["status"] == "done"


def test_render_failure_retry_from_subtitle_reuses_tts(client, tts, project_id, monkeypatch) -> None:
    original = runner.render.render_clip
    monkeypatch.setattr(runner.render, "render_clip", lambda *_: (_ for _ in ()).throw(runner.AppError("RENDER_FAILED")))
    client.post(f"/api/projects/{project_id}/render")
    project = get(client, project_id)
    assert project["error"]["stage"] == "render" and project["error"]["code"] == "RENDER_FAILED"
    assert "ffmpeg" not in project["error"]["message"]
    calls = tts.calls

    monkeypatch.setattr(runner.render, "render_clip", original)
    client.post(f"/api/projects/{project_id}/render?from=subtitle")
    assert get(client, project_id)["status"] == "done"
    assert tts.calls == calls


def test_from_render_with_missing_tts_runs_previous_steps(client, tts, project_id) -> None:
    client.post(f"/api/projects/{project_id}/render?from=render")
    assert get(client, project_id)["status"] == "done"
    assert tts.calls == 4


def test_render_requires_images(client, tts) -> None:
    from tests.conftest import VALID_TEXT

    project_id = client.post("/api/projects", json={"type": "text", "text": VALID_TEXT}).json()["id"]
    response = client.post(f"/api/projects/{project_id}/render")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "MISSING_IMAGE"
    assert tts.calls == 0


def test_render_rejects_bad_from_and_busy_state(client, tts, project_id, store) -> None:
    assert client.post(f"/api/projects/{project_id}/render?from=nope").status_code == 422

    async def busy() -> None:
        def change(target) -> None:
            target.status = "rendering"
        await store.update(project_id, change)

    client.portal.call(busy)
    assert client.post(f"/api/projects/{project_id}/render").status_code == 409


def test_length_note_only_outside_range(client, project_id, store) -> None:
    project = client.portal.call(store.get, project_id)
    for seconds, expected in ((10.0, False), (15.0, False), (16.0, True)):
        for scene in project.scenes:
            scene.duration_sec = seconds
        assert bool(runner._length_note(project)) is expected  # 장면 4개: 40초·60초·64초
    for scene in project.scenes:
        scene.duration_sec = 5.0
    assert "20초" in runner._length_note(project)


@pytest.fixture
def ffmpeg_filters(monkeypatch) -> list[str]:
    """실행한 장면 렌더 명령에서 움직임 필터 이름만 모은다."""
    seen: list[str] = []
    original = runner.render.run_tool

    def spy(command, cwd=None):
        joined = " ".join(command)
        if "apad" in joined:
            seen.append("zoompan" if "zoompan" in joined else "perspective" if "perspective" in joined else "none")
        return original(command, cwd=cwd)

    monkeypatch.setattr(runner.render, "run_tool", spy)
    return seen


def test_quality_default_is_fast_with_or_without_body(client, tts, project_id, ffmpeg_filters) -> None:
    client.post(f"/api/projects/{project_id}/render")
    assert ffmpeg_filters == ["zoompan"] * 4
    ffmpeg_filters.clear()
    client.post(f"/api/projects/{project_id}/render", json={})
    assert ffmpeg_filters == ["zoompan"] * 4


def test_changing_quality_rerenders_clips_and_reuses_voice(client, tts, project_id, ffmpeg_filters, caplog) -> None:
    with caplog.at_level("INFO", logger="blog2shorts"):
        client.post(f"/api/projects/{project_id}/render", json={"motionQuality": "smooth"})
        assert tts.calls == 4 and len(ffmpeg_filters) == 4
        ffmpeg_filters.clear()

        client.post(f"/api/projects/{project_id}/render", json={"motionQuality": "fast"})
        assert ffmpeg_filters == ["zoompan"] * 4
        assert get(client, project_id)["status"] == "done"
        ffmpeg_filters.clear()

        client.post(f"/api/projects/{project_id}/render?from=render", json={"motionQuality": "smooth"})
        assert len(ffmpeg_filters) == 4 and "zoompan" not in ffmpeg_filters
        ffmpeg_filters.clear()

        client.post(f"/api/projects/{project_id}/render?from=subtitle", json={"motionQuality": "fast"})
        assert ffmpeg_filters == ["zoompan"] * 4
    assert tts.calls == 4
    assert "렌더 소요(smooth)" in caplog.text and "렌더 소요(fast)" in caplog.text
    project = get(client, project_id)
    assert project["status"] == "done"
    assert "motionQuality" not in project


@pytest.mark.parametrize("body", [{"motionQuality": "slow"}, {"motionQuality": None}])
def test_bad_quality_is_invalid_request_and_keeps_state(client, tts, project_id, body: dict) -> None:
    response = client.post(f"/api/projects/{project_id}/render", json=body)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REQUEST"
    assert get(client, project_id)["status"] == "ready"
    assert tts.calls == 0


@pytest.mark.parametrize("quality", ["fast", "smooth"])
@pytest.mark.parametrize("motion", ["zoom_in", "zoom_out", "pan_left", "pan_right", "none"])
def test_render_clip_all_motions(tmp_path, motion: str, quality: str) -> None:
    fixtures = Path(__file__).parent / "fixtures" / "images"
    clips = tmp_path / "clips"
    clips.mkdir()
    runner.render.prepare_fonts(clips, Path(__file__).parent.parent / "fonts" / "NotoSansKR-Bold.ttf")
    audio = tmp_path / "a.mp3"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.5",
                    "-c:a", "libmp3lame", str(audio)], check=True)
    ass = tmp_path / "s.ass"
    runner.subtitle.write_ass(ass, runner.subtitle.build_subtitles("움직임 확인", 0.5))

    clip = runner.render.render_clip(clips, "s1", fixtures / "landscape.jpg", audio, ass, motion, 1.0, quality)

    stream = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
         "-show_entries", "stream=width,height,r_frame_rate,pix_fmt,color_range,nb_read_frames",
         "-of", "json", str(clip)], capture_output=True, encoding="utf-8").stdout)["streams"][0]
    assert (stream["width"], stream["height"], stream["r_frame_rate"]) == (1080, 1920, "30/1")
    assert (stream["pix_fmt"], stream["color_range"]) == ("yuv420p", "tv")
    assert stream["nb_read_frames"] == "30"
    assert not (clips / "s1_still.png").exists()


def test_video_before_render_is_404(client, project_id) -> None:
    response = client.get(f"/api/projects/{project_id}/video")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"

"""단계 실행 순서·status/progress 갱신·오류 기록·렌더 동시 1건. 라우터는 이 모듈만 호출한다."""

import asyncio
import logging
import time
from collections.abc import Callable
from pathlib import Path

from app.config import get_settings
from app.errors import AppError
from app.models import (Asset, ErrorCode, MotionQuality, Progress, Project, ProjectError, RenderStage, SceneUpdate,
                        Stage, Video)
from app.pipeline import match, naver, relate, render, script, subtitle, tts
from app.pipeline.media import probe_duration
from app.providers.llm_base import LlmProvider
from app.providers.tts_base import TtsProvider
from app.store import ProjectStore

logger = logging.getLogger("blog2shorts")

_EDITABLE = ("ready", "done", "error")
SUBTITLE_FONT = "NotoSansKR-Bold.ttf"
MIN_VIDEO_SEC, MAX_VIDEO_SEC = 30, 60
_render_gate: asyncio.Semaphore | None = None

_FALLBACK_CODE: dict[Stage, ErrorCode] = {
    "extract": "EXTRACT_FAILED",
    "script": "LLM_FAILED",
    "tts": "TTS_FAILED",
    "subtitle": "RENDER_FAILED",
    "render": "RENDER_FAILED",
}


def _set_progress(stage: Stage, percent: float, message: str) -> Callable[[Project], None]:
    def change(project: Project) -> None:
        project.progress = Progress(stage=stage, percent=percent, message=message)
    return change


def _fail(stage: Stage, error: AppError) -> Callable[[Project], None]:
    def change(project: Project) -> None:
        project.status = "error"
        project.progress = None
        project.error = ProjectError(stage=stage, code=error.code, message=error.message)
    return change


async def _record_failure(store: ProjectStore, project_id: str, stage: Stage, exc: Exception) -> None:
    if isinstance(exc, AppError):
        logger.warning("프로젝트 %s %s 단계 실패: %s", project_id, stage, exc.code)
        error = exc
    else:
        logger.error("프로젝트 %s %s 단계 예외", project_id, stage, exc_info=exc)
        error = AppError(_FALLBACK_CODE[stage])
    await store.update(project_id, _fail(stage, error))


def validate_input(url: str | None, text: str | None) -> None:
    """POST /projects에서 바로 거절할 입력. 잘못되면 AppError."""
    if url is not None:
        naver.parse_naver_url(url)
    if text is not None:
        naver.text_to_blocks(text)


async def _extract(store: ProjectStore, project_id: str, text: str | None) -> None:
    project = await store.get(project_id)
    paths = store.paths(project_id)
    await asyncio.to_thread(paths.make_dirs)
    await store.update(project_id, _set_progress("extract", 0, "블로그 글을 읽고 있어요"))

    if text is not None:
        blocks = naver.text_to_blocks(text)
        title = None
    else:
        async with naver.new_client() as client:
            result = await naver.extract(client, project.source.url or "", paths.assets, store.new_asset_id)
        for asset, file in result.assets:
            await store.add_asset(project_id, asset, file)
        blocks = result.blocks
        title = result.title
    linked = relate.link_images(blocks)  # ②

    def fill(target: Project) -> None:
        target.source.title = title
        target.source.blocks = linked
        target.needs_upload = match.needs_upload(target.assets)
    await store.update(project_id, fill)


async def _write_script(store: ProjectStore, project_id: str, llm: LlmProvider) -> None:
    project = await store.get(project_id)

    def to_scripting(target: Project) -> None:
        target.status = "scripting"
        target.progress = Progress(stage="script", percent=0, message="대본을 쓰고 있어요")
    await store.update(project_id, to_scripting)

    result = await script.generate_script(llm, project.source.blocks, project.assets)  # ③

    def finish(target: Project) -> None:
        target.analysis = result.analysis
        target.script = result.script
        target.scenes = match.assign_assets(result.scenes, target.assets)  # ④
        target.needs_upload = match.needs_upload(target.assets)
        target.status = "ready"
        target.progress = None
        target.error = None
    await store.update(project_id, finish)


async def run_create(store: ProjectStore, project_id: str, llm: LlmProvider, text: str | None = None) -> None:
    """POST /projects 뒤 백그라운드: ① 추출 → ②~④ 대본·장면 → ready."""
    stage: Stage = "extract"
    try:
        await _extract(store, project_id, text)
        stage = "script"
        await _write_script(store, project_id, llm)
    except Exception as exc:
        await _record_failure(store, project_id, stage, exc)


async def start_regenerate(store: ProjectStore, project_id: str) -> None:
    """요청 시점에 상태를 바꾼다. 대본이 없는 LLM_FAILED 상태에서도 받는다. 추출 전이면 거절."""
    def change(project: Project) -> None:
        if project.status not in _EDITABLE or not project.source.blocks:
            raise AppError("INVALID_STATE")
        project.status = "scripting"
        project.video = None
        project.error = None
        project.progress = Progress(stage="script", percent=0, message="대본을 쓰고 있어요")
    await store.update(project_id, change)


async def run_regenerate(store: ProjectStore, project_id: str, llm: LlmProvider) -> None:
    """③④만 다시. 실패하면 이전 대본·장면은 그대로 두고 error만 기록한다."""
    try:
        await _write_script(store, project_id, llm)
    except Exception as exc:
        await _record_failure(store, project_id, "script", exc)


async def start_render(store: ProjectStore, project_id: str) -> None:
    """요청 시점에 상태를 바꾼다. 이미지 없는 장면이 있으면 거절."""
    def change(project: Project) -> None:
        if project.status not in _EDITABLE or not project.scenes:
            raise AppError("INVALID_STATE")
        known = {asset.id for asset in project.assets}
        if any(scene.asset_id not in known for scene in project.scenes):
            raise AppError("MISSING_IMAGE")
        project.status = "rendering"
        project.error = None
        project.video = None
        project.progress = Progress(stage="tts", percent=0, message="렌더 순서를 기다리고 있어요")
    await store.update(project_id, change)


def _get_render_gate() -> asyncio.Semaphore:
    global _render_gate
    if _render_gate is None:
        _render_gate = asyncio.Semaphore(get_settings().max_render_concurrency)
    return _render_gate


async def _run_tts(store: ProjectStore, project_id: str, tts_provider: TtsProvider) -> None:
    project = await store.get(project_id)
    tts_dir = store.paths(project_id).tts
    count = len(project.scenes)
    for index, scene in enumerate(project.scenes):
        await store.update(project_id, _set_progress("tts", 100 * index / count, f"음성을 만들고 있어요 ({index + 1}/{count})"))
        path = await tts.synthesize_scene(tts_provider, scene.text, tts_dir)
        seconds = await tts.audio_seconds(path)

        def set_duration(target: Project, scene_id: str = scene.id, duration: float = seconds) -> None:
            for item in target.scenes:
                if item.id == scene_id:
                    item.duration_sec = round(duration + tts.END_PADDING_SEC, 3)
        await store.update(project_id, set_duration)


def _length_note(project: Project) -> str:
    """통합기획서 Q6: 길이가 30~60초 밖이면 렌더는 멈추지 않고 진행 문구와 로그로 알린다(계약 변경 없음)."""
    total = sum((scene.duration_sec or 0) for scene in project.scenes)
    if MIN_VIDEO_SEC <= total <= MAX_VIDEO_SEC:
        return ""
    logger.warning("프로젝트 %s 영상 길이 %.1f초: %d~%d초 밖", project.id, total, MIN_VIDEO_SEC, MAX_VIDEO_SEC)
    return f" · 전체 {total:.0f}초로 권장 길이({MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초)를 벗어났어요"


async def _run_subtitles(store: ProjectStore, project_id: str, tts_provider: TtsProvider) -> None:
    project = await store.get(project_id)
    paths = store.paths(project_id)
    for scene in project.scenes:
        audio = tts.audio_path(tts_provider, scene.text, paths.tts)
        seconds = await tts.audio_seconds(audio)
        items = subtitle.build_subtitles(scene.text, seconds)
        await asyncio.to_thread(subtitle.write_ass, paths.subs / f"{scene.id}.ass", items)

        def set_subtitles(target: Project, scene_id: str = scene.id, new_items: list = items) -> None:
            for item in target.scenes:
                if item.id == scene_id:
                    item.subtitles = new_items
        await store.update(project_id, set_subtitles)
    await store.update(project_id, _set_progress("subtitle", 100, "자막을 만들었어요"))


async def _run_compose(store: ProjectStore, project_id: str, tts_provider: TtsProvider, quality: MotionQuality) -> None:
    """장면 클립은 매번 새로 만든다. 다른 품질로 만든 클립을 재사용하지 않기 위해서다."""
    project = await store.get(project_id)
    paths = store.paths(project_id)
    await asyncio.to_thread(render.prepare_fonts, paths.clips, get_settings().fonts_dir / SUBTITLE_FONT)
    clips = []
    count = len(project.scenes)
    note = _length_note(project)
    await store.update(project_id, _set_progress("render", 10, f"영상을 합치고 있어요{note}"))
    for index, scene in enumerate(project.scenes, start=1):
        clip = await asyncio.to_thread(
            render.render_clip, paths.clips, scene.id,
            await store.asset_file(scene.asset_id or ""),
            tts.audio_path(tts_provider, scene.text, paths.tts),
            paths.subs / f"{scene.id}.ass",
            scene.motion,
            scene.duration_sec or 0,
            quality,
        )
        clips.append(clip)
        await store.update(project_id, _set_progress("render", 10 + 80 * index / count, f"영상을 합치고 있어요 ({index}/{count}){note}"))
    await asyncio.to_thread(render.concat_clips, paths.clips, clips, paths.output)
    seconds = await asyncio.to_thread(probe_duration, paths.output)

    def finish(target: Project) -> None:
        target.video = Video(url=f"/api/projects/{project_id}/video", duration_sec=round(seconds, 2))
        target.status = "done"
        target.progress = None
        target.error = None
    await store.update(project_id, finish)


async def run_render(store: ProjectStore, project_id: str, tts_provider: TtsProvider,
                     from_stage: RenderStage = "tts", quality: MotionQuality = "fast") -> None:
    """⑤~⑦. from_stage부터 하되 앞 단계 산출물이 없으면 그 단계도 다시 한다(TTS는 캐시라 비용 없음)."""
    stage: Stage = "tts"
    timings: dict[str, float] = {}
    try:
        async with _get_render_gate():
            paths = store.paths(project_id)
            await asyncio.to_thread(paths.make_dirs)
            project = await store.get(project_id)

            has_tts = all(
                scene.duration_sec is not None and tts.audio_path(tts_provider, scene.text, paths.tts).is_file()
                for scene in project.scenes
            )
            has_subs = all(scene.subtitles and (paths.subs / f"{scene.id}.ass").is_file() for scene in project.scenes)
            run_tts = from_stage == "tts" or not has_tts
            run_subs = run_tts or from_stage == "subtitle" or not has_subs

            started = time.perf_counter()
            if run_tts:
                await _run_tts(store, project_id, tts_provider)
                timings["tts"] = time.perf_counter() - started
            stage = "subtitle"
            started = time.perf_counter()
            if run_subs:
                await _run_subtitles(store, project_id, tts_provider)
                timings["subtitle"] = time.perf_counter() - started
            stage = "render"
            started = time.perf_counter()
            await _run_compose(store, project_id, tts_provider, quality)
            timings["render"] = time.perf_counter() - started
        logger.info("프로젝트 %s 렌더 소요(%s): %s", project_id, quality, {key: round(value, 2) for key, value in timings.items()})
    except Exception as exc:
        await _record_failure(store, project_id, stage, exc)


async def video_file(store: ProjectStore, project_id: str) -> Path:
    project = await store.get(project_id)
    path = store.paths(project_id).output
    if project.video is None or not path.is_file():
        raise AppError("NOT_FOUND", "아직 만들어진 영상이 없습니다.")
    return path


async def update_scenes(store: ProjectStore, project_id: str, updates: list[SceneUpdate]) -> Project:
    """통합기획서 6-2 PATCH /scenes. 하나라도 잘못되면 아무것도 바꾸지 않는다."""
    def change(project: Project) -> None:
        if project.status not in _EDITABLE:
            raise AppError("INVALID_STATE", "작업이 진행 중이라 장면을 고칠 수 없습니다.")
        scenes = {scene.id: scene for scene in project.scenes}
        asset_ids = {asset.id for asset in project.assets}
        for update in updates:
            if update.id not in scenes:
                raise AppError("INVALID_REQUEST", f"없는 장면입니다: {update.id}")
            if "text" in update.model_fields_set and not (update.text or "").strip():
                raise AppError("INVALID_REQUEST", "장면 문구가 비어 있습니다.")
            if "asset_id" in update.model_fields_set and update.asset_id not in asset_ids:
                raise AppError("MISSING_IMAGE", "이 작업에 없는 이미지입니다.")
            if "motion" in update.model_fields_set and update.motion is None:
                raise AppError("INVALID_REQUEST", "모션 값이 올바르지 않습니다.")

        changed = False
        for update in updates:
            scene = scenes[update.id]
            if "asset_id" in update.model_fields_set and update.asset_id != scene.asset_id:
                scene.asset_id = update.asset_id
                changed = True
            if "motion" in update.model_fields_set and update.motion != scene.motion:
                scene.motion = update.motion
                changed = True
            if "text" in update.model_fields_set and update.text != scene.text:
                scene.text = update.text
                scene.duration_sec = None
                scene.subtitles = []
                changed = True
        if changed:
            project.video = None
            if project.status == "done":
                project.status = "ready"
    return await store.update(project_id, change)


async def add_upload(store: ProjectStore, project_id: str, data: bytes) -> Asset:
    """업로드 검사: jpg·png·webp, 10MB 이하, Pillow로 열림."""
    await store.get(project_id)
    if len(data) > naver.MAX_IMAGE_BYTES:
        raise AppError("UPLOAD_INVALID")
    try:
        width, height, image_format = await asyncio.to_thread(naver.decode_image, data)
    except Exception:
        raise AppError("UPLOAD_INVALID") from None
    if image_format not in ("jpeg", "png", "webp"):
        raise AppError("UPLOAD_INVALID")

    paths = store.paths(project_id)
    await asyncio.to_thread(paths.make_dirs)
    asset_id = store.new_asset_id()
    file = await asyncio.to_thread(naver.save_image, data, image_format, paths.assets / asset_id)
    asset = Asset(id=asset_id, origin="upload", url=f"/api/assets/{asset_id}", width=width, height=height)
    await store.add_asset(project_id, asset, file)
    return asset

"""단계 실행 순서·status/progress 갱신·오류 기록·렌더 동시 1건. 라우터는 이 모듈만 호출한다."""

import asyncio
import logging
from collections.abc import Callable

from app.errors import AppError
from app.models import ErrorCode, Progress, Project, ProjectError, Stage
from app.pipeline import match, naver, relate, script
from app.providers.llm_base import LlmProvider
from app.store import ProjectStore

logger = logging.getLogger("blog2shorts")

_EDITABLE = ("ready", "done", "error")

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

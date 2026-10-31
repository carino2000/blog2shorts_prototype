from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import FileResponse

from app.models import ErrorResponse, ProjectIdResponse, RenderStage
from app.pipeline import runner
from app.providers.tts_base import TtsProvider, get_tts_provider
from app.store import ProjectStore, get_store

router = APIRouter(prefix="/api", tags=["render"])


@router.post(
    "/projects/{project_id}/render",
    response_model=ProjectIdResponse,
    status_code=202,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
)
async def start_render(
    project_id: str,
    background_tasks: BackgroundTasks,
    from_stage: Annotated[RenderStage, Query(alias="from")] = "tts",
    store: ProjectStore = Depends(get_store),
    tts_provider: TtsProvider = Depends(get_tts_provider),
) -> ProjectIdResponse:
    """⑤~⑦ 시작. from이 있으면 그 단계부터 다시(완료된 TTS 재사용). 모든 장면에 이미지가 있어야 한다."""
    await runner.start_render(store, project_id)
    background_tasks.add_task(runner.run_render, store, project_id, tts_provider, from_stage)
    return ProjectIdResponse(id=project_id)


@router.get(
    "/projects/{project_id}/video",
    response_class=FileResponse,
    status_code=200,
    responses={200: {"content": {"video/mp4": {}}}, 404: {"model": ErrorResponse}},
)
async def get_video(
    project_id: str,
    download: int = 0,
    store: ProjectStore = Depends(get_store),
) -> FileResponse:
    """미리보기·다운로드. ?download=1이면 attachment."""
    path = await runner.video_file(store, project_id)
    if download:
        return FileResponse(path, media_type="video/mp4", filename=f"blog2shorts_{project_id}.mp4")
    return FileResponse(path, media_type="video/mp4")

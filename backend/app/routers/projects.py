from fastapi import APIRouter, BackgroundTasks, Depends

from app.models import CreateProjectRequest, ErrorResponse, Project, ProjectIdResponse, Source, UrlInput
from app.pipeline import runner
from app.store import ProjectStore, get_store

router = APIRouter(prefix="/api", tags=["projects"])


@router.post(
    "/projects",
    response_model=ProjectIdResponse,
    status_code=202,
    responses={422: {"model": ErrorResponse}},
)
async def create_project(
    body: CreateProjectRequest,
    background_tasks: BackgroundTasks,
    store: ProjectStore = Depends(get_store),
) -> ProjectIdResponse:
    """작업 생성. ①~④를 백그라운드로 시작한다."""
    if isinstance(body, UrlInput):
        source = Source(type="url", url=body.url, title=None, blocks=[])
    else:
        source = Source(type="text", url=None, title=None, blocks=[])
    project = await store.create(source)
    background_tasks.add_task(runner.run_create, store, project.id)
    return ProjectIdResponse(id=project.id)


@router.get(
    "/projects/{project_id}",
    response_model=Project,
    status_code=200,
    responses={404: {"model": ErrorResponse}},
)
async def get_project(project_id: str, store: ProjectStore = Depends(get_store)) -> Project:
    """상태 조회. 진행 중엔 프론트가 1.5초 간격으로 폴링한다."""
    return await store.get(project_id)

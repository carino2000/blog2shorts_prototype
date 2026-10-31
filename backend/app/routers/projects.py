from fastapi import APIRouter, BackgroundTasks, Depends

from app.models import CreateProjectRequest, ErrorResponse, Project, ProjectIdResponse, Source, UrlInput
from app.pipeline import runner
from app.providers.llm_base import LlmProvider, get_llm_provider
from app.store import ProjectStore, get_store

router = APIRouter(prefix="/api", tags=["projects"])


@router.post(
    "/projects",
    response_model=ProjectIdResponse,
    status_code=202,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
async def create_project(
    body: CreateProjectRequest,
    background_tasks: BackgroundTasks,
    store: ProjectStore = Depends(get_store),
    llm: LlmProvider = Depends(get_llm_provider),
) -> ProjectIdResponse:
    """작업 생성. 잘못된 주소·짧은 본문은 400, 나머지는 ①~④를 백그라운드로 시작한다."""
    if isinstance(body, UrlInput):
        runner.validate_input(body.url, None)
        source = Source(type="url", url=body.url, title=None, blocks=[])
        text = None
    else:
        runner.validate_input(None, body.text)
        source = Source(type="text", url=None, title=None, blocks=[])
        text = body.text
    project = await store.create(source)
    background_tasks.add_task(runner.run_create, store, project.id, llm, text)
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


@router.post(
    "/projects/{project_id}/regenerate",
    response_model=ProjectIdResponse,
    status_code=202,
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
)
async def regenerate_project(
    project_id: str,
    background_tasks: BackgroundTasks,
    store: ProjectStore = Depends(get_store),
    llm: LlmProvider = Depends(get_llm_provider),
) -> ProjectIdResponse:
    """대본·장면 다시 생성(③④만). 첫 대본이 실패해 대본이 없는 상태에서도 받는다."""
    await runner.start_regenerate(store, project_id)
    background_tasks.add_task(runner.run_regenerate, store, project_id, llm)
    return ProjectIdResponse(id=project_id)

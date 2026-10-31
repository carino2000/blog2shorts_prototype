from fastapi import APIRouter, Depends

from app.models import ErrorResponse, Project, UpdateScenesRequest
from app.pipeline import runner
from app.store import ProjectStore, get_store

router = APIRouter(prefix="/api", tags=["scenes"])


@router.patch(
    "/projects/{project_id}/scenes",
    response_model=Project,
    status_code=200,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse},
               409: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
async def update_scenes(
    project_id: str,
    body: UpdateScenesRequest,
    store: ProjectStore = Depends(get_store),
) -> Project:
    """장면 수정. status가 ready·done·error일 때만. 문구가 바뀐 장면만 길이·자막을 되돌린다."""
    return await runner.update_scenes(store, project_id, body.scenes)

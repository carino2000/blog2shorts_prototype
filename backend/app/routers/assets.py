from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.models import ErrorResponse
from app.store import ProjectStore, get_store

router = APIRouter(prefix="/api", tags=["assets"])


@router.get(
    "/assets/{asset_id}",
    response_class=FileResponse,
    status_code=200,
    responses={200: {"content": {"image/*": {}}}, 404: {"model": ErrorResponse}},
)
async def get_asset(asset_id: str, store: ProjectStore = Depends(get_store)) -> FileResponse:
    """블로그·업로드 이미지 서빙."""
    return FileResponse(await store.asset_file(asset_id))

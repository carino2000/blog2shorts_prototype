from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import FileResponse

from app.errors import AppError
from app.models import Asset, ErrorResponse
from app.pipeline import naver, runner
from app.store import ProjectStore, get_store

router = APIRouter(prefix="/api", tags=["assets"])


@router.post(
    "/projects/{project_id}/assets",
    response_model=Asset,
    status_code=201,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
async def upload_asset(project_id: str, file: UploadFile, store: ProjectStore = Depends(get_store)) -> Asset:
    """이미지 업로드 (jpg/png/webp, 10MB 이하)."""
    data = await file.read(naver.MAX_IMAGE_BYTES + 1)
    if len(data) > naver.MAX_IMAGE_BYTES:
        raise AppError("UPLOAD_INVALID")
    return await runner.add_upload(store, project_id, data)


@router.get(
    "/assets/{asset_id}",
    response_class=FileResponse,
    status_code=200,
    responses={200: {"content": {"image/*": {}}}, 404: {"model": ErrorResponse}},
)
async def get_asset(asset_id: str, store: ProjectStore = Depends(get_store)) -> FileResponse:
    """블로그·업로드 이미지 서빙."""
    return FileResponse(await store.asset_file(asset_id))

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["health"])


class HealthResponse(BaseModel):
    ok: bool


@router.get("/health", response_model=HealthResponse, status_code=200)
async def health() -> HealthResponse:
    """백엔드 실행 여부 확인."""
    return HealthResponse(ok=True)

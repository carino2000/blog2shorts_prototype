import logging
import shutil
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health

logger = logging.getLogger("blog2shorts")

SUBTITLE_FONT = "NotoSansKR-Bold.ttf"


def check_render_tools() -> list[str]:
    """렌더에 필요한 ffmpeg·ffprobe·자막 폰트 중 없는 것을 돌려준다."""
    settings = get_settings()
    missing = [tool for tool in ("ffmpeg", "ffprobe") if shutil.which(tool) is None]
    if not (settings.fonts_dir / SUBTITLE_FONT).is_file():
        missing.append(f"fonts/{SUBTITLE_FONT}")
    return missing


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    missing = check_render_tools()
    if missing:
        # 추출·대본 단계는 이것 없이도 돌기 때문에 서버는 띄운다. 렌더는 실패한다.
        logger.warning("렌더 준비 안 됨 — 없음: %s (README '설치' 참고)", ", ".join(missing))
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="blog2shorts API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    return app


app = create_app()

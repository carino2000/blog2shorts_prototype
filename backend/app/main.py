import asyncio
import logging
import shutil
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.errors import register_error_handlers
from app.routers import assets, health, projects, render, scenes
from app.store import get_store

logger = logging.getLogger("blog2shorts")

SUBTITLE_FONT = "NotoSansKR-Bold.ttf"
CLEANUP_INTERVAL_SEC = 60 * 60


def configure_logging() -> None:
    """uvicorn은 자기 로거만 설정한다. 토큰 사용량·TTS 캐시 INFO 로그가 보이게 따로 단다."""
    if logger.handlers:
        return
    reconfigure = getattr(sys.stderr, "reconfigure", None)
    if reconfigure:
        reconfigure(encoding="utf-8", errors="replace")  # Windows 기본 cp949에서 한글이 깨짐
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(levelname)s:     [%(name)s] %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


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
    cleanup = asyncio.create_task(_cleanup_loop())
    yield
    cleanup.cancel()


async def _cleanup_loop() -> None:
    """24시간 지난 프로젝트 폴더를 시작 시와 1시간마다 지운다."""
    while True:
        try:
            removed = await get_store().purge_expired()
            if removed:
                logger.info("오래된 프로젝트 %d개 삭제", len(removed))
        except Exception:
            logger.exception("프로젝트 정리 실패")
        await asyncio.sleep(CLEANUP_INTERVAL_SEC)


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()
    app = FastAPI(title="blog2shorts API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    app.include_router(health.router)
    app.include_router(projects.router)
    app.include_router(scenes.router)
    app.include_router(assets.router)
    app.include_router(render.router)
    return app


app = create_app()

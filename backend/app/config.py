"""환경변수 설정. 경로는 모두 backend/ 폴더 기준 절대 경로로 푼다."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,  # .env.example을 그대로 복사해 빈 칸이 남아도 기본값을 쓴다
        extra="ignore",
    )

    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]
    data_dir: Path = Path("./data")
    fonts_dir: Path = Path("./fonts")

    llm_provider: str = "gemini"
    llm_api_key: str = ""
    llm_model: str = ""

    tts_provider: str = "google"
    tts_credentials_json: str = ""
    tts_voice: str = ""

    max_render_concurrency: int = 1

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        # .env에는 "a,b" 형태로 적는다
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("data_dir", "fonts_dir")
    @classmethod
    def _resolve_from_backend(cls, value: Path) -> Path:
        return value if value.is_absolute() else (BACKEND_DIR / value).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()

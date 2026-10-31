"""통합기획서 6-1 데이터 계약의 복사본 + 요청 바디 모델. JSON 필드명은 camelCase."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

ProjectStatus = Literal["extracting", "scripting", "ready", "rendering", "done", "error"]
Stage = Literal["extract", "script", "tts", "subtitle", "render"]
RenderStage = Literal["tts", "subtitle", "render"]
Motion = Literal["zoom_in", "zoom_out", "pan_left", "pan_right", "none"]
ErrorCode = Literal[
    "NOT_NAVER_URL", "POST_NOT_FOUND", "EXTRACT_FAILED",
    "TEXT_TOO_SHORT", "LLM_FAILED", "TTS_FAILED",
    "RENDER_FAILED", "MISSING_IMAGE", "UPLOAD_INVALID",
    # ✅ 추가(10/29, 사람 승인): 6-2 공통 오류 형식에 쓸 코드가 없던 경우
    "NOT_FOUND", "INVALID_REQUEST", "INVALID_STATE",
]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, serialize_by_alias=True)


class Progress(CamelModel):
    stage: Stage
    percent: float
    message: str


class ProjectError(CamelModel):
    stage: Stage
    code: ErrorCode
    message: str


class Block(CamelModel):
    id: str
    type: Literal["heading", "paragraph", "image"]
    text: str | None
    asset_id: str | None
    linked_block_ids: list[str]


class Source(CamelModel):
    type: Literal["url", "text"]
    url: str | None
    title: str | None
    blocks: list[Block]


class Asset(CamelModel):
    id: str
    origin: Literal["blog", "upload"]
    url: str
    width: int
    height: int


class Analysis(CamelModel):
    summary: str
    key_points: list[str]


class Script(CamelModel):
    hook: str
    body: str
    cta: str
    estimated_sec: float


class Subtitle(CamelModel):
    start_sec: float
    end_sec: float
    text: str


class Scene(CamelModel):
    id: str
    order: int
    role: Literal["hook", "body", "cta"]
    text: str
    asset_id: str | None
    motion: Motion
    source_block_ids: list[str]
    duration_sec: float | None
    subtitles: list[Subtitle]


class Video(CamelModel):
    url: str
    duration_sec: float
    width: Literal[1080] = 1080
    height: Literal[1920] = 1920
    fps: Literal[30] = 30


class Project(CamelModel):
    id: str
    status: ProjectStatus
    progress: Progress | None
    error: ProjectError | None
    source: Source
    assets: list[Asset]
    needs_upload: bool
    analysis: Analysis | None
    script: Script | None
    scenes: list[Scene]
    video: Video | None
    created_at: str


# ── 요청·응답 바디 ──

class UrlInput(CamelModel):
    type: Literal["url"]
    url: str


class TextInput(CamelModel):
    type: Literal["text"]
    text: str


CreateProjectRequest = Annotated[UrlInput | TextInput, Field(discriminator="type")]


class SceneUpdate(CamelModel):
    id: str
    text: str | None = None
    asset_id: str | None = None
    motion: Motion | None = None


class UpdateScenesRequest(CamelModel):
    scenes: list[SceneUpdate]


class ProjectIdResponse(CamelModel):
    id: str


class ErrorBody(CamelModel):
    code: ErrorCode
    message: str


class ErrorResponse(CamelModel):
    error: ErrorBody

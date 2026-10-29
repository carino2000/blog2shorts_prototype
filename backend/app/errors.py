"""AppError와 전역 예외 핸들러. 모든 오류를 통합기획서 6-2 공통 형식으로 바꾼다."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.models import ErrorBody, ErrorCode, ErrorResponse

logger = logging.getLogger("blog2shorts")

# 각 코드의 기본 사용자 메시지와 HTTP 상태
DEFAULTS: dict[ErrorCode, tuple[int, str]] = {
    "NOT_NAVER_URL": (400, "네이버 블로그 글 주소가 아닙니다. 주소를 확인하거나 본문을 직접 입력해 주세요."),
    "POST_NOT_FOUND": (404, "글을 찾을 수 없습니다. 비공개 글이거나 삭제된 글인지 확인해 주세요."),
    "EXTRACT_FAILED": (422, "글 내용을 가져오지 못했습니다. 본문을 직접 입력해 주세요."),
    "TEXT_TOO_SHORT": (400, "본문이 너무 짧습니다. 200자 이상 입력해 주세요."),
    "LLM_FAILED": (502, "대본을 만들지 못했습니다. 잠시 뒤 다시 시도해 주세요."),
    "TTS_FAILED": (502, "음성을 만들지 못했습니다. 잠시 뒤 다시 시도해 주세요."),
    "RENDER_FAILED": (500, "영상을 만들지 못했습니다. 다시 시도해 주세요."),
    "MISSING_IMAGE": (400, "이미지가 없는 장면이 있습니다. 이미지를 고르거나 올려 주세요."),
    "UPLOAD_INVALID": (400, "jpg·png·webp 형식의 10MB 이하 이미지만 올릴 수 있습니다."),
    "NOT_FOUND": (404, "작업이 만료되었습니다. 처음부터 다시 시작해 주세요."),
    "INVALID_REQUEST": (422, "요청 형식이 올바르지 않습니다."),
    "INVALID_STATE": (409, "지금은 이 작업을 할 수 없습니다. 진행 중인 작업이 끝난 뒤 다시 시도해 주세요."),
}


class AppError(Exception):
    def __init__(self, code: ErrorCode, message: str | None = None, status: int | None = None) -> None:
        default_status, default_message = DEFAULTS[code]
        self.code: ErrorCode = code
        self.message = message or default_message
        self.status = status or default_status
        super().__init__(f"{code}: {self.message}")


def error_response(code: ErrorCode, message: str, status: int) -> JSONResponse:
    body = ErrorResponse(error=ErrorBody(code=code, message=message))
    return JSONResponse(status_code=status, content=body.model_dump(mode="json"))


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return error_response(exc.code, exc.message, exc.status)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        logger.info("요청 검증 실패: %s", exc.errors()[:3])
        status, message = DEFAULTS["INVALID_REQUEST"]
        return error_response("INVALID_REQUEST", message, status)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        # 라우터가 없는 경로·허용 안 된 메서드 등 프레임워크가 내는 오류
        if exc.status_code == 404:
            return error_response("NOT_FOUND", "없는 주소입니다.", 404)
        if exc.status_code == 405:
            return error_response("INVALID_REQUEST", "허용되지 않은 요청 방식입니다.", 405)
        return error_response("INVALID_REQUEST", str(exc.detail), exc.status_code)

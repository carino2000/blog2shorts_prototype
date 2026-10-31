"""ffmpeg·ffprobe 실행 공통. 리스트 인자 + utf-8 출력(Windows 기본 cp949에서 깨짐)."""

import logging
import subprocess
from pathlib import Path

from app.errors import AppError

logger = logging.getLogger("blog2shorts")


def run_tool(command: list[str], cwd: Path | None = None) -> str:
    """실패하면 stderr 마지막 20줄을 로그에 남기고 RENDER_FAILED. 사용자 메시지에는 넣지 않는다."""
    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, encoding="utf-8", errors="replace")
    except FileNotFoundError as error:
        logger.error("%s를 찾을 수 없음. README '설치' 참고", command[0])
        raise AppError("RENDER_FAILED") from error
    if result.returncode != 0:
        logger.error("%s 실패(exit %s):\n%s", command[0], result.returncode, "\n".join(result.stderr.splitlines()[-20:]))
        raise AppError("RENDER_FAILED")
    return result.stdout


def probe_duration(path: Path) -> float:
    output = run_tool(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(output.strip())

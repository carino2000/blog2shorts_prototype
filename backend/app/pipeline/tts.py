"""⑤ 장면별 TTS + 캐시. 같은 문구는 다시 부르지 않는다(예산 관리의 핵심)."""

import asyncio
import hashlib
import logging
from pathlib import Path

from app.errors import AppError
from app.pipeline.media import probe_duration
from app.providers.tts_base import TtsCallError, TtsProvider

logger = logging.getLogger("blog2shorts")

END_PADDING_SEC = 0.3


def audio_path(provider: TtsProvider, text: str, tts_dir: Path) -> Path:
    key = "\n".join((provider.name, provider.model, provider.voice, text))
    return tts_dir / f"{hashlib.sha256(key.encode('utf-8')).hexdigest()}.mp3"


async def synthesize_scene(provider: TtsProvider, text: str, tts_dir: Path) -> Path:
    path = audio_path(provider, text, tts_dir)
    if path.is_file():
        logger.info("TTS 캐시 사용 %s: 호출 안 함", path.stem[:12])
        return path
    logger.info("TTS 호출 %s: %d자, %s/%s", path.stem[:12], len(text), provider.model, provider.voice)
    try:
        data = await provider.synthesize(text)
    except TtsCallError as error:
        raise AppError("TTS_FAILED") from error
    # 받다가 끊겨도 깨진 파일이 캐시로 남지 않게 다 받은 뒤 이름을 바꾼다
    temporary = path.with_suffix(".tmp")
    await asyncio.to_thread(temporary.write_bytes, data)
    await asyncio.to_thread(temporary.replace, path)
    return path


async def audio_seconds(path: Path) -> float:
    return await asyncio.to_thread(probe_duration, path)

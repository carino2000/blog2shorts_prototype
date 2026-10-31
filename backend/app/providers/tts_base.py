from typing import Protocol


class TtsCallError(Exception):
    """외부 호출 실패. 호출한 쪽은 재시도하지 않는다(예산 보호)."""


class TtsProvider(Protocol):
    name: str
    model: str
    voice: str

    async def synthesize(self, text: str) -> bytes:
        """mp3 바이트를 돌려준다."""
        ...


def get_tts_provider() -> TtsProvider:
    from app.config import get_settings
    from app.providers.tts_openai import OpenAiTts

    settings = get_settings()
    if settings.tts_provider != "openai":
        raise ValueError(f"지원하지 않는 TTS_PROVIDER: {settings.tts_provider}")
    return OpenAiTts(settings.llm_api_key, settings.tts_model, settings.tts_voice)

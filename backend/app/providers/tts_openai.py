import logging

import openai

from app.providers.tts_base import TtsCallError

logger = logging.getLogger("blog2shorts")


class OpenAiTts:
    name = "openai"

    def __init__(self, api_key: str, model: str, voice: str) -> None:
        self.api_key = api_key
        self.model = model
        self.voice = voice

    async def synthesize(self, text: str) -> bytes:
        for label, value in (("LLM_API_KEY", self.api_key), ("TTS_MODEL", self.model), ("TTS_VOICE", self.voice)):
            if not value:
                logger.error("%s가 비어 있음", label)
                raise TtsCallError(f"{label}가 비어 있음")

        # SDK 자동 재시도를 끈다. 잔액 부족을 되풀이해서 부르지 않기 위해서다
        client = openai.AsyncOpenAI(api_key=self.api_key, max_retries=0, timeout=120.0)
        try:
            response = await client.audio.speech.create(
                model=self.model, voice=self.voice, input=text, response_format="mp3"
            )
            return response.content
        except openai.APIStatusError as error:
            code = getattr(error, "code", None)
            logger.error("OpenAI TTS 호출 실패: HTTP %s %s", error.status_code, code)
            raise TtsCallError(f"HTTP {error.status_code} {code}") from error
        except openai.APIError as error:
            logger.error("OpenAI TTS 호출 실패: %s", type(error).__name__)
            raise TtsCallError(type(error).__name__) from error
        finally:
            await client.close()

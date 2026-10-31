import logging
from typing import Any

import openai

from app.providers.llm_base import LlmCallError, LlmResult

logger = logging.getLogger("blog2shorts")


class OpenAiLlm:
    def __init__(self, api_key: str, model: str, reasoning_effort: str = "") -> None:
        self.api_key = api_key
        self.model = model
        self.reasoning_effort = reasoning_effort

    async def generate_json(self, system: str, user: str, schema: dict[str, Any], schema_name: str) -> LlmResult:
        if not self.api_key:
            logger.error("LLM_API_KEY가 비어 있음")
            raise LlmCallError("LLM_API_KEY가 비어 있음")
        if not self.model:
            logger.error("LLM_MODEL이 비어 있음")
            raise LlmCallError("LLM_MODEL이 비어 있음")

        # SDK 자동 재시도를 끈다. 잔액 부족을 되풀이해서 부르지 않기 위해서다
        client = openai.AsyncOpenAI(api_key=self.api_key, max_retries=0, timeout=180.0)
        extra: dict[str, Any] = {"reasoning": {"effort": self.reasoning_effort}} if self.reasoning_effort else {}
        try:
            response = await client.responses.create(
                model=self.model,
                instructions=system,
                input=user,
                text={"format": {"type": "json_schema", "name": schema_name, "schema": schema, "strict": True}},
                **extra,
            )
        except openai.APIStatusError as error:
            code = getattr(error, "code", None)
            logger.error("OpenAI 대본 호출 실패: HTTP %s %s", error.status_code, code)
            raise LlmCallError(f"HTTP {error.status_code} {code}") from error
        except openai.APIError as error:
            logger.error("OpenAI 대본 호출 실패: %s", type(error).__name__)
            raise LlmCallError(type(error).__name__) from error
        finally:
            await client.close()

        usage = response.usage
        return LlmResult(
            text=response.output_text,
            model=response.model,
            input_tokens=usage.input_tokens if usage else 0,
            output_tokens=usage.output_tokens if usage else 0,
        )

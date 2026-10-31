from dataclasses import dataclass
from typing import Any, Protocol


class LlmCallError(Exception):
    """외부 호출 실패. 호출한 쪽은 재시도하지 않는다(예산 보호)."""


@dataclass
class LlmResult:
    text: str
    model: str
    input_tokens: int
    output_tokens: int


class LlmProvider(Protocol):
    async def generate_json(self, system: str, user: str, schema: dict[str, Any], schema_name: str) -> LlmResult:
        """schema를 따르는 JSON 문자열을 돌려준다."""
        ...


def get_llm_provider() -> LlmProvider:
    from app.config import get_settings
    from app.providers.llm_openai import OpenAiLlm

    settings = get_settings()
    if settings.llm_provider != "openai":
        raise ValueError(f"지원하지 않는 LLM_PROVIDER: {settings.llm_provider}")
    return OpenAiLlm(settings.llm_api_key, settings.llm_model, settings.llm_reasoning_effort)

import asyncio
from typing import AsyncGenerator
from config.settings import settings

# OpenAI 모델 ID 목록
OPENAI_MODELS = {"gpt-4o", "gpt-4o-mini", "text-embed-3-lg", "whisper-v3", "dalle-3"}
# Anthropic 모델 ID 목록
ANTHROPIC_MODELS = {"claude-37", "claude-haiku"}

# 실제 API 모델명 매핑
MODEL_API_NAMES = {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "claude-37": "claude-3-7-sonnet-20250219",
    "claude-haiku": "claude-3-5-haiku-20241022",
}


class LLMGateway:
    """멀티 프로바이더 LLM 클라이언트. API 키가 없으면 목업 스트림 반환."""

    async def stream_chat(
        self,
        model_id: str,
        messages: list[dict],
        system: str = "",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs,
    ) -> AsyncGenerator[dict, None]:
        """텍스트 청크와 사용량 정보를 비동기 제너레이터로 반환."""
        if model_id in OPENAI_MODELS and settings.openai_api_key:
            async for chunk in self._openai_stream(model_id, messages, system, temperature, max_tokens):
                yield chunk
        elif model_id in ANTHROPIC_MODELS and settings.anthropic_api_key:
            async for chunk in self._anthropic_stream(model_id, messages, system, temperature, max_tokens):
                yield chunk
        else:
            async for chunk in self._mock_stream(model_id):
                yield chunk

    async def _openai_stream(
        self,
        model_id: str,
        messages: list[dict],
        system: str,
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[dict, None]:
        """OpenAI API 스트리밍 호출."""
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.openai_api_key)
            api_model = MODEL_API_NAMES.get(model_id, model_id)

            all_messages = []
            if system:
                all_messages.append({"role": "system", "content": system})
            all_messages.extend(messages)

            input_tokens = 0
            output_tokens = 0

            stream = await client.chat.completions.create(
                model=api_model,
                messages=all_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                stream_options={"include_usage": True},
            )

            async for event in stream:
                if event.choices and event.choices[0].delta.content:
                    delta = event.choices[0].delta.content
                    yield {"type": "content", "delta": delta}
                if event.usage:
                    input_tokens = event.usage.prompt_tokens or 0
                    output_tokens = event.usage.completion_tokens or 0

            yield {
                "type": "done",
                "usage": {"input_tokens": input_tokens, "output_tokens": output_tokens},
            }
        except Exception as e:
            yield {"type": "content", "delta": f"[OpenAI 오류: {str(e)}] "}
            yield {"type": "done", "usage": {"input_tokens": 0, "output_tokens": 0}}

    async def _anthropic_stream(
        self,
        model_id: str,
        messages: list[dict],
        system: str,
        temperature: float,
        max_tokens: int,
    ) -> AsyncGenerator[dict, None]:
        """Anthropic API 스트리밍 호출."""
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
            api_model = MODEL_API_NAMES.get(model_id, model_id)

            input_tokens = 0
            output_tokens = 0

            async with client.messages.stream(
                model=api_model,
                messages=messages,
                system=system or "",
                temperature=temperature,
                max_tokens=max_tokens,
            ) as stream:
                async for text in stream.text_stream:
                    output_tokens += len(text.split())
                    yield {"type": "content", "delta": text}

                final = await stream.get_final_message()
                if final.usage:
                    input_tokens = final.usage.input_tokens
                    output_tokens = final.usage.output_tokens

            yield {
                "type": "done",
                "usage": {"input_tokens": input_tokens, "output_tokens": output_tokens},
            }
        except Exception as e:
            yield {"type": "content", "delta": f"[Anthropic 오류: {str(e)}] "}
            yield {"type": "done", "usage": {"input_tokens": 0, "output_tokens": 0}}

    async def _mock_stream(self, model_id: str) -> AsyncGenerator[dict, None]:
        """API 키 없을 때 사실적인 목업 스트리밍 응답 반환."""
        response_text = (
            f"[{model_id} 시뮬레이션 응답]\n\n"
            "안녕하세요! 이것은 시뮬레이션 응답입니다. "
            f"현재 **{model_id}** 모델의 API 키가 설정되지 않아 "
            "목업 응답을 반환하고 있습니다.\n\n"
            "실제 모델을 사용하려면 `.env` 파일에 다음을 설정하세요:\n"
            "- OpenAI 모델: `OPENAI_API_KEY=sk-...`\n"
            "- Anthropic 모델: `ANTHROPIC_API_KEY=sk-ant-...`\n\n"
            "Enterprise LLM Platform에서 지원하는 기능:\n"
            "1. 멀티 프로바이더 게이트웨이\n"
            "2. RAG 파이프라인 통합\n"
            "3. 실시간 스트리밍 응답\n"
            "4. 토큰 사용량 추적 및 비용 분석"
        )

        words = response_text.split(" ")
        for word in words:
            yield {"type": "content", "delta": word + " "}
            await asyncio.sleep(0.04)

        yield {
            "type": "done",
            "usage": {"input_tokens": 50, "output_tokens": len(words)},
        }


llm_gateway = LLMGateway()

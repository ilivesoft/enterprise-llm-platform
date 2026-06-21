from __future__ import annotations

from typing import AsyncGenerator

from pipeline.vectorstore import SearchResult
from services.llm_gateway import llm_gateway


class RAGGenerator:
    """검색 결과를 컨텍스트로 사용해 LLM 응답을 스트리밍한다."""

    def build_context(
        self, results: list[SearchResult]
    ) -> tuple[str, list[dict]]:
        """SearchResult 목록에서 컨텍스트 문자열과 인용 목록을 생성한다."""
        context_parts: list[str] = []
        citations: list[dict] = []
        for i, r in enumerate(results, 1):
            context_parts.append(f"[{i}] {r.text}")
            citations.append(
                {
                    "n": i,
                    "src": r.doc_filename,
                    "loc": f"chunk {r.chunk_index}",
                }
            )
        context = "\n\n".join(context_parts)
        return context, citations

    def build_system_prompt(self, context: str) -> str:
        """RAG용 시스템 프롬프트를 구성한다."""
        return (
            "You are a helpful assistant with access to the following document excerpts.\n"
            "Use only the provided context to answer. "
            "If the answer is not in the context, say so.\n"
            "Cite sources using [N] notation matching the excerpt numbers.\n\n"
            f"CONTEXT:\n{context}"
        )

    # @MX:ANCHOR: [AUTO] RAG 스트리밍 생성 공개 API — rag_service, 테스트에서 호출
    # @MX:REASON: fan_in >= 3; 청크 형식 변경 시 SSE 이벤트 스트림 파싱 오류
    async def stream(
        self,
        query: str,
        results: list[SearchResult],
        model_id: str,
        history: list[dict] | None = None,
    ) -> AsyncGenerator[dict, None]:
        """RAG 증강 응답을 스트리밍하고 마지막에 인용 이벤트를 전송한다."""
        context, citations = self.build_context(results)
        system_prompt = self.build_system_prompt(context)

        messages = list(history or [])
        messages.append({"role": "user", "content": query})

        async for chunk in llm_gateway.stream_chat(
            model_id=model_id,
            messages=messages,
            system=system_prompt,
        ):
            yield chunk

        # LLM 스트림 종료 후 인용 이벤트 전송
        yield {"type": "citations", "citations": citations}

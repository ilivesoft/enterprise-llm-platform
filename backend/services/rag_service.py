from __future__ import annotations

import asyncio
import uuid
from pathlib import Path
from typing import AsyncGenerator

from pipeline.parser import DocumentParser
from pipeline.cleaner import TextCleaner
from pipeline.chunker import RecursiveTextChunker
from pipeline.embedder import Embedder
from pipeline.vectorstore import ChromaVectorStore
from pipeline.retriever import HybridRetriever
from pipeline.reranker import CrossEncoderReranker
from pipeline.generator import RAGGenerator
from config.settings import settings


# @MX:ANCHOR: [AUTO] RAG 파이프라인 오케스트레이터 — ingest 엔드포인트, messages.py, 테스트에서 호출
# @MX:REASON: fan_in >= 3; 모든 RAG 진입점이 이 싱글톤을 통해 파이프라인에 접근
class RAGService:
    """RAG 파이프라인 전 단계를 조율하는 오케스트레이터.

    파이프라인: 파싱 → 청킹 → 임베딩 → 벡터저장 → 검색 → 재순위 → 생성
    """

    def __init__(self) -> None:
        self.parser = DocumentParser()
        self.cleaner = TextCleaner()
        self.chunker = RecursiveTextChunker(
            chunk_size=settings.rag_chunk_size,
            chunk_overlap=settings.rag_chunk_overlap,
        )
        self.embedder = Embedder(
            model_name=settings.rag_embedding_model,
            use_openai=settings.rag_use_openai_embed,
            openai_key=settings.openai_api_key,
        )
        self.vectorstore = ChromaVectorStore(persist_dir=settings.rag_chroma_path)
        self.retriever = HybridRetriever(
            self.vectorstore, self.embedder, top_k=settings.rag_top_k
        )
        self.reranker = CrossEncoderReranker()
        self.generator = RAGGenerator()
        self.upload_dir = Path(settings.rag_upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def ingest_file(self, service_id: str, file_path: Path) -> dict:
        """파일을 파싱·청킹·임베딩·저장하고 문서 메타데이터를 반환한다."""
        doc_id = str(uuid.uuid4())

        parsed = self.parser.parse(file_path)
        cleaned_text = self.cleaner.clean(parsed.text)

        chunks = self.chunker.split(
            cleaned_text,
            doc_filename=parsed.filename,
            metadata=parsed.metadata,
        )
        if not chunks:
            return {
                "doc_id": doc_id,
                "filename": parsed.filename,
                "chunks": 0,
                "error": "텍스트를 추출할 수 없습니다.",
            }

        texts = [c.text for c in chunks]
        embeddings = self.embedder.embed(texts)

        self.vectorstore.add_chunks(service_id, chunks, embeddings, doc_id)

        return {
            "doc_id": doc_id,
            "filename": parsed.filename,
            "chunks": len(chunks),
        }

    def list_docs(self, service_id: str) -> list[dict]:
        """서비스에 인덱싱된 문서 목록을 반환한다."""
        return self.vectorstore.list_docs(service_id)

    def delete_doc(self, service_id: str, doc_id: str) -> None:
        """서비스에서 특정 문서를 삭제한다."""
        self.vectorstore.delete_doc(service_id, doc_id)

    # @MX:WARN: [AUTO] 동기 임베딩 작업을 비동기 컨텍스트에서 직접 호출
    # @MX:REASON: 임베딩은 CPU 집약적 작업 — 프로덕션에서는 asyncio.to_thread() 사용 권장
    async def stream_rag_response(
        self,
        service_id: str,
        query: str,
        model_id: str,
        history: list[dict] | None = None,
    ) -> AsyncGenerator[dict, None]:
        """전체 RAG 파이프라인 실행 후 스트리밍 응답을 반환한다.

        문서가 없으면 LLM 직접 호출로 폴백한다.
        """
        # 검색·재순위는 CPU 집약적 — 스레드풀에서 실행해 이벤트 루프 블로킹 방지
        candidates = await asyncio.to_thread(
            self.retriever.retrieve, service_id, query
        )

        if not candidates:
            # 인덱싱된 문서 없음 — LLM 직접 호출
            from services.llm_gateway import llm_gateway

            msgs = list(history or []) + [{"role": "user", "content": query}]
            async for chunk in llm_gateway.stream_chat(
                model_id=model_id, messages=msgs
            ):
                yield chunk
            return

        top_results = await asyncio.to_thread(
            self.reranker.rerank, query, candidates, settings.rag_top_n
        )

        async for chunk in self.generator.stream(query, top_results, model_id, history):
            yield chunk


# 싱글톤 — DB 의존성 없음, 임포트 시 안전하게 초기화됨
rag_service = RAGService()

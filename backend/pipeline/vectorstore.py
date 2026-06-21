from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from pipeline.chunker import Chunk


@dataclass
class SearchResult:
    text: str
    doc_filename: str
    chunk_index: int
    score: float
    metadata: dict = field(default_factory=dict)


# @MX:ANCHOR: [AUTO] ChromaDB 벡터스토어 공개 API — retriever, rag_service, ingest 엔드포인트에서 호출
# @MX:REASON: fan_in >= 3; add_chunks/search/delete_doc 시그니처 변경 시 전체 RAG 파이프라인 영향
class ChromaVectorStore:
    """서비스별 ChromaDB 컬렉션을 관리한다. 컬렉션명 = service_{service_id}."""

    def __init__(self, persist_dir: str = "./storage/chroma_db") -> None:
        self.persist_dir = persist_dir
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            import chromadb  # type: ignore[import-untyped]

            self._client = chromadb.PersistentClient(path=self.persist_dir)
        return self._client

    def _get_collection(self, service_id: str) -> Any:
        client = self._get_client()
        return client.get_or_create_collection(
            name=f"service_{service_id}",
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(
        self,
        service_id: str,
        chunks: list[Chunk],
        embeddings: list[list[float]],
        doc_id: str,
    ) -> None:
        """청크와 임베딩을 컬렉션에 추가한다."""
        collection = self._get_collection(service_id)
        ids = [f"{doc_id}_chunk_{c.chunk_index}" for c in chunks]
        metadatas = [
            {
                "doc_id": doc_id,
                "doc_filename": c.doc_filename,
                "chunk_index": c.chunk_index,
                **c.metadata,
            }
            for c in chunks
        ]
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=[c.text for c in chunks],
            metadatas=metadatas,
        )

    def search(
        self,
        service_id: str,
        query_embedding: list[float],
        top_k: int = 10,
    ) -> list[SearchResult]:
        """코사인 유사도 기반 벡터 검색을 수행한다."""
        collection = self._get_collection(service_id)
        count = collection.count()
        if count == 0:
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, count),
        )
        items: list[SearchResult] = []
        for text, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            items.append(
                SearchResult(
                    text=text,
                    doc_filename=meta.get("doc_filename", ""),
                    chunk_index=int(meta.get("chunk_index", 0)),
                    score=1.0 - float(dist),  # 코사인 거리 → 유사도
                    metadata=meta,
                )
            )
        return items

    def list_docs(self, service_id: str) -> list[dict]:
        """서비스 컬렉션의 고유 문서 목록을 반환한다."""
        collection = self._get_collection(service_id)
        if collection.count() == 0:
            return []

        results = collection.get(include=["metadatas"])
        seen: dict[str, dict] = {}
        for meta in results["metadatas"]:
            doc_id = meta.get("doc_id", "")
            if not doc_id:
                continue
            if doc_id not in seen:
                seen[doc_id] = {
                    "doc_id": doc_id,
                    "filename": meta.get("doc_filename", ""),
                    "chunk_count": 0,
                }
            seen[doc_id]["chunk_count"] += 1

        return list(seen.values())

    def delete_doc(self, service_id: str, doc_id: str) -> None:
        """특정 문서의 모든 청크를 컬렉션에서 삭제한다."""
        collection = self._get_collection(service_id)
        results = collection.get(where={"doc_id": doc_id})
        if results["ids"]:
            collection.delete(ids=results["ids"])

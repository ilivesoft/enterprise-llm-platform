from __future__ import annotations

from pipeline.vectorstore import ChromaVectorStore, SearchResult
from pipeline.embedder import Embedder


class HybridRetriever:
    """벡터 유사도 + BM25 키워드 검색을 RRF(Reciprocal Rank Fusion)로 결합한다."""

    def __init__(
        self,
        vectorstore: ChromaVectorStore,
        embedder: Embedder,
        top_k: int = 10,
    ) -> None:
        self.vectorstore = vectorstore
        self.embedder = embedder
        self.top_k = top_k

    # @MX:ANCHOR: [AUTO] 하이브리드 검색 공개 API — rag_service, 테스트에서 호출
    # @MX:REASON: fan_in >= 3; RRF 가중치 변경 시 검색 품질에 직접 영향
    def retrieve(self, service_id: str, query: str) -> list[SearchResult]:
        """벡터 + BM25 검색 후 RRF로 병합한 결과를 반환한다."""
        # 1단계: 벡터 검색
        query_embedding = self.embedder.embed_one(query)
        vector_results = self.vectorstore.search(
            service_id, query_embedding, top_k=self.top_k
        )
        if not vector_results:
            return []

        # 2단계: BM25 키워드 점수 계산 (벡터 검색 결과 텍스트 대상)
        all_texts = [r.text for r in vector_results]
        bm25_scores = self._bm25_score(query, all_texts)

        # 3단계: RRF 병합
        vector_ranks = {r.text: i for i, r in enumerate(vector_results)}
        bm25_ranked = sorted(
            range(len(all_texts)), key=lambda i: bm25_scores[i], reverse=True
        )
        bm25_ranks = {all_texts[i]: rank for rank, i in enumerate(bm25_ranked)}

        k = 60  # RRF 상수 (표준값)

        def rrf_score(text: str) -> float:
            vrank = vector_ranks.get(text, len(vector_results))
            brank = bm25_ranks.get(text, len(all_texts))
            return 1.0 / (k + vrank) + 1.0 / (k + brank)

        sorted_results = sorted(
            vector_results, key=lambda r: rrf_score(r.text), reverse=True
        )
        return sorted_results

    # @MX:WARN: [AUTO] rank_bm25 미설치 시 단순 TF 폴백 사용
    # @MX:REASON: 선택적 의존성 — 폴백 점수는 정확도가 낮으나 서비스 중단 방지
    def _bm25_score(self, query: str, documents: list[str]) -> list[float]:
        """BM25Okapi로 점수를 계산하고, 미설치 시 단순 TF로 폴백한다."""
        try:
            from rank_bm25 import BM25Okapi  # type: ignore[import-untyped]

            tokenized_docs = [doc.lower().split() for doc in documents]
            bm25 = BM25Okapi(tokenized_docs)
            scores = bm25.get_scores(query.lower().split())
            return scores.tolist()
        except ImportError:
            query_terms = set(query.lower().split())
            scores: list[float] = []
            for doc in documents:
                doc_terms = doc.lower().split()
                tf = sum(1 for t in doc_terms if t in query_terms) / max(
                    len(doc_terms), 1
                )
                scores.append(tf)
            return scores

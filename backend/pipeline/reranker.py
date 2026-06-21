from __future__ import annotations

from typing import Any

from pipeline.vectorstore import SearchResult


# @MX:WARN: [AUTO] 크로스 인코더 지연 로딩 — 모델 다운로드 수백 MB 발생 가능
# @MX:REASON: sentence-transformers 미설치 또는 네트워크 제한 환경에서 예외 발생; 폴백으로 안전 처리
class CrossEncoderReranker:
    """크로스 인코더로 재순위를 매긴다. 모델 미설치 시 기존 점수 기반 정렬로 폴백한다."""

    MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    _model: Any = None
    _load_attempted: bool = False

    def _load(self) -> None:
        if self._load_attempted:
            return
        self._load_attempted = True
        try:
            from sentence_transformers import CrossEncoder  # type: ignore[import-untyped]

            self._model = CrossEncoder(self.MODEL_NAME)
        except Exception:
            # 크로스 인코더 로딩 실패 시 폴백 모드로 동작
            self._model = None

    def rerank(
        self,
        query: str,
        results: list[SearchResult],
        top_n: int = 3,
    ) -> list[SearchResult]:
        """결과를 재순위하고 상위 top_n개를 반환한다."""
        if not results:
            return results

        self._load()

        if self._model is None:
            # 크로스 인코더 없음: 기존 점수 내림차순으로 상위 N개 반환
            return sorted(results, key=lambda r: r.score, reverse=True)[:top_n]

        pairs = [(query, r.text) for r in results]
        scores: list[float] = self._model.predict(pairs).tolist()

        ranked = sorted(
            zip(results, scores), key=lambda x: x[1], reverse=True
        )
        reranked: list[SearchResult] = []
        for result, score in ranked[:top_n]:
            result.score = float(score)
            reranked.append(result)
        return reranked

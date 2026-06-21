from __future__ import annotations

from typing import Any


# @MX:WARN: [AUTO] 지연 로딩 패턴 — 모델은 첫 embed() 호출 시 로드됨
# @MX:REASON: SentenceTransformer 로딩이 수 초 소요; 임포트 시 로드 시 서버 시작 지연
class Embedder:
    """임베딩 모델 래퍼. 첫 사용 시 모델을 로드해 서버 시작 지연을 방지한다.

    로컬 모드: sentence-transformers (기본값, BAAI/bge-m3)
    OpenAI 모드: openai.Client (openai_key 제공 시 활성화)
    """

    def __init__(
        self,
        model_name: str = "BAAI/bge-m3",
        use_openai: bool = False,
        openai_key: str = "",
    ) -> None:
        self.model_name = model_name
        self.use_openai = use_openai and bool(openai_key)
        self.openai_key = openai_key
        self._model: Any = None

    def _load_model(self) -> None:
        if self._model is not None:
            return

        if self.use_openai:
            from openai import OpenAI  # type: ignore[import-untyped]

            self._model = OpenAI(api_key=self.openai_key)
        else:
            from sentence_transformers import SentenceTransformer  # type: ignore[import-untyped]

            self._model = SentenceTransformer(self.model_name)

    # @MX:ANCHOR: [AUTO] 배치 임베딩 공개 API — retriever, rag_service, 테스트에서 호출
    # @MX:REASON: fan_in >= 3; 반환 형식(list[list[float]]) 변경 시 vectorstore 호환성 깨짐
    def embed(self, texts: list[str]) -> list[list[float]]:
        """텍스트 목록을 벡터 목록으로 변환한다."""
        self._load_model()

        if self.use_openai:
            response = self._model.embeddings.create(
                input=texts,
                model="text-embedding-3-small",
            )
            return [item.embedding for item in response.data]
        else:
            embeddings = self._model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            return embeddings.tolist()

    def embed_one(self, text: str) -> list[float]:
        """단일 텍스트를 벡터로 변환한다."""
        return self.embed([text])[0]

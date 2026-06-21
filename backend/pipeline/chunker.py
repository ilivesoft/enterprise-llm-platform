from dataclasses import dataclass, field


@dataclass
class Chunk:
    text: str
    chunk_index: int
    doc_filename: str
    metadata: dict = field(default_factory=dict)


# @MX:ANCHOR: [AUTO] 청크 분할 공개 API — rag_service, 테스트, 향후 인덱서에서 호출
# @MX:REASON: fan_in >= 3이며 청크 크기/오버랩 변경 시 검색 품질에 직접 영향
class RecursiveTextChunker:
    """LangChain 없이 순수 Python으로 구현한 RecursiveCharacterTextSplitter."""

    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 64) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        # 구분자 우선순위: 단락 > 줄바꿈 > 문장 > 공백 > 문자 단위
        self._separators = ["\n\n", "\n", ". ", " ", ""]

    def split(
        self,
        text: str,
        doc_filename: str,
        metadata: dict | None = None,
    ) -> list[Chunk]:
        """텍스트를 오버랩이 있는 청크 목록으로 분할한다."""
        raw_chunks = self._split_text(text)
        return [
            Chunk(
                text=c,
                chunk_index=i,
                doc_filename=doc_filename,
                metadata=metadata or {},
            )
            for i, c in enumerate(raw_chunks)
        ]

    def _split_text(self, text: str) -> list[str]:
        for sep in self._separators:
            if sep and sep in text:
                return self._split_by_separator(text, sep)
        return self._split_by_separator(text, "")

    # @MX:WARN: [AUTO] 재귀적 강제 분할 로직 — chunk_size보다 긴 단일 분리 조각 처리
    # @MX:REASON: 강제 슬라이싱과 오버랩 적용이 복합적으로 작동해 경계 조건 오류 가능성
    def _split_by_separator(self, text: str, separator: str) -> list[str]:
        splits: list[str] = text.split(separator) if separator else list(text)

        chunks: list[str] = []
        current = ""
        for split in splits:
            candidate = (current + separator + split).strip() if current else split
            if len(candidate) <= self.chunk_size:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                if len(split) > self.chunk_size:
                    # 단일 조각이 chunk_size 초과 시 강제 슬라이싱
                    step = max(self.chunk_size - self.chunk_overlap, 1)
                    sub = [
                        split[i : i + self.chunk_size]
                        for i in range(0, len(split), step)
                    ]
                    chunks.extend(sub[:-1])
                    current = sub[-1] if sub else ""
                else:
                    current = split

        if current:
            chunks.append(current)

        # 청크 간 오버랩 삽입
        overlapped: list[str] = []
        for i, chunk in enumerate(chunks):
            if i > 0 and self.chunk_overlap > 0:
                prev_tail = chunks[i - 1][-self.chunk_overlap :]
                chunk = prev_tail + " " + chunk
            overlapped.append(chunk)

        return [c for c in overlapped if c.strip()]

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./enterprise_llm.db"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # RAG pipeline settings
    rag_chunk_size: int = 512
    rag_chunk_overlap: int = 64
    rag_embedding_model: str = "BAAI/bge-m3"
    rag_use_openai_embed: bool = False
    rag_chroma_path: str = "./storage/chroma_db"
    rag_upload_dir: str = "./storage/uploads"
    rag_top_k: int = 10
    rag_top_n: int = 3

    # OCR settings (EasyOCR)
    ocr_languages: list[str] = ["ko", "en"]
    ocr_gpu: bool = False

    class Config:
        env_file = ".env"


settings = Settings()

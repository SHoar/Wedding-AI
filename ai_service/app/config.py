"""Centralized configuration from environment."""

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-5-nano", alias="OPENAI_MODEL")
    openai_summarization_model: str = Field(
        default="", alias="OPENAI_SUMMARIZATION_MODEL"
    )
    openai_qa_model: str = Field(default="", alias="OPENAI_QA_MODEL")
    ai_http_timeout: float = Field(default=45.0, alias="AI_HTTP_TIMEOUT")
    docs_dir: str = Field(default="./docs", alias="DOCS_DIR")
    rag_top_k: int = Field(default=5, alias="RAG_TOP_K")
    rag_top_k_min: int = Field(default=3, alias="RAG_TOP_K_MIN")
    rag_top_k_max: int = Field(default=8, alias="RAG_TOP_K_MAX")
    rag_rerank_enabled: bool = Field(default=False, alias="RAG_RERANK_ENABLED")
    cohere_api_key: str = Field(default="", alias="COHERE_API_KEY")
    rag_chunk_size: int = Field(default=512, alias="RAG_CHUNK_SIZE")
    rag_chunk_overlap: int = Field(default=150, alias="RAG_CHUNK_OVERLAP")
    chroma_persist_dir: str = Field(default="./data/chroma", alias="CHROMA_PERSIST_DIR")
    rag_auto_refresh_interval_seconds: int = Field(
        default=300, alias="RAG_AUTO_REFRESH_INTERVAL_SECONDS"
    )
    openai_embedding_model: str = Field(
        default="text-embedding-3-small", alias="OPENAI_EMBEDDING_MODEL"
    )
    cache_ttl_seconds: int = Field(default=0, alias="CACHE_TTL_SECONDS")
    redis_url: str = Field(default="", alias="REDIS_URL")
    rag_cache_ttl_seconds: int = Field(default=0, alias="RAG_CACHE_TTL_SECONDS")
    rag_max_context_chars: int = Field(default=8000, alias="RAG_MAX_CONTEXT_CHARS")

    @property
    def redis_url_stripped(self) -> str:
        return (self.redis_url or "").strip()

    @property
    def openai_api_key_stripped(self) -> str:
        return (self.openai_api_key or "").strip()

    @property
    def cohere_api_key_stripped(self) -> str:
        return (self.cohere_api_key or "").strip()


def get_settings() -> Settings:
    """Return application settings (cached per process)."""
    return Settings()

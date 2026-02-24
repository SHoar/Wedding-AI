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
    ai_http_timeout: float = Field(default=45.0, alias="AI_HTTP_TIMEOUT")
    docs_dir: str = Field(default="./docs", alias="DOCS_DIR")
    rag_top_k: int = Field(default=5, alias="RAG_TOP_K")
    chroma_persist_dir: str = Field(default="./data/chroma", alias="CHROMA_PERSIST_DIR")
    openai_embedding_model: str = Field(
        default="text-embedding-3-small", alias="OPENAI_EMBEDDING_MODEL"
    )
    cache_ttl_seconds: int = Field(default=0, alias="CACHE_TTL_SECONDS")

    @property
    def openai_api_key_stripped(self) -> str:
        return (self.openai_api_key or "").strip()


def get_settings() -> Settings:
    """Return application settings (cached per process)."""
    return Settings()

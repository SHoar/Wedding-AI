"""Pytest fixtures: TestClient, mocked config, fake RAG store."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app, get_rag_store_dep


@pytest.fixture
def mock_settings():
    """Settings with a fake API key so require_api_key passes."""
    settings = MagicMock()
    settings.openai_api_key_stripped = "sk-fake"
    settings.openai_model = "gpt-5-nano"
    settings.openai_embedding_model = "text-embedding-3-small"
    settings.ai_http_timeout = 45.0
    settings.docs_dir = "./docs"
    settings.rag_top_k = 5
    settings.chroma_persist_dir = "./data/chroma"
    settings.cache_ttl_seconds = 0
    return settings


@pytest.fixture
def client(mock_settings, fake_rag_store):
    """FastAPI TestClient with mocked settings, RAG store, and LLM calls."""
    with (
        patch("app.main.get_settings", return_value=mock_settings),
        patch("app.config.get_settings", return_value=mock_settings),
        patch("app.main.summarize_context", return_value="Summary."),
        patch("app.main.generate_answer", new_callable=AsyncMock, return_value="Mocked answer."),
    ):
        app.dependency_overrides[get_rag_store_dep] = lambda: fake_rag_store
        try:
            yield TestClient(app)
        finally:
            app.dependency_overrides.clear()


@pytest.fixture
def client_no_api_key():
    """Client with no API key (for 503 tests)."""
    settings = MagicMock()
    settings.openai_api_key_stripped = ""
    settings.openai_model = "gpt-5-nano"
    with (
        patch("app.main.get_settings", return_value=settings),
        patch("app.config.get_settings", return_value=settings),
    ):
        yield TestClient(app)


@pytest.fixture
def fake_rag_store():
    """Fake store that returns fixed chunks for similarity_search."""
    store = MagicMock()
    from langchain_core.documents import Document

    store.similarity_search.return_value = [
        Document(page_content="Doc chunk one.", metadata={}),
        Document(page_content="Doc chunk two.", metadata={}),
    ]
    return store


def minimal_ask_payload():
    """Minimal valid payload for POST /ask."""
    return {
        "question": "How many guests?",
        "wedding": {"id": 1, "name": "Test Wedding", "date": None, "venue_name": None},
        "guests": [],
        "tasks": [],
        "guestbook_entries": [],
    }

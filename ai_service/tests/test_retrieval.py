"""Tests for RAG retrieve and get_retrieved_context."""

from unittest.mock import MagicMock

import pytest
from langchain_core.documents import Document

from app.retrieval import get_retrieved_context, retrieve


@pytest.fixture
def mock_store():
    """Chroma-like store with similarity_search returning fake Documents."""
    store = MagicMock()
    store.similarity_search.return_value = [
        Document(page_content="First chunk.", metadata={}),
        Document(page_content="Second chunk.", metadata={}),
    ]
    return store


@pytest.fixture
def mock_settings_retrieval(monkeypatch):
    """Patch get_settings in retrieval module for tests."""
    s = MagicMock()
    s.rag_top_k = 5
    s.rag_top_k_min = 3
    s.rag_top_k_max = 8
    s.rag_rerank_enabled = False
    s.cohere_api_key = ""
    s.cohere_api_key_stripped = ""
    s.rag_max_context_chars = 8000
    monkeypatch.setattr("app.retrieval.get_settings", lambda: s)
    return s


def test_retrieve_returns_list_of_strings(mock_store, mock_settings_retrieval):
    """retrieve(question, store, k) returns list of page_content strings."""
    result = retrieve("How do I add a guest?", mock_store, k=2)
    assert result == ["First chunk.", "Second chunk."]
    mock_store.similarity_search.assert_called_once()
    call_kwargs = mock_store.similarity_search.call_args[1]
    assert call_kwargs["k"] == 2
    assert "How do I add a guest?" in mock_store.similarity_search.call_args[0]


def test_retrieve_empty_question_returns_empty_list(mock_store, mock_settings_retrieval):
    """retrieve with empty question returns []."""
    result = retrieve("", mock_store)
    assert result == []
    mock_store.similarity_search.assert_not_called()


def test_retrieve_none_store_returns_empty_list():
    """retrieve with None store returns []."""
    result = retrieve("question", None)
    assert result == []


def test_get_retrieved_context_formats_chunks(mock_store, mock_settings_retrieval):
    """get_retrieved_context returns string with 'Relevant documentation' and separator."""
    result = get_retrieved_context("query", mock_store, k=2)
    assert result.startswith("Relevant documentation:")
    assert "First chunk." in result
    assert "Second chunk." in result
    assert "---" in result


def test_get_retrieved_context_empty_chunks_returns_empty_string(
    mock_store, mock_settings_retrieval
):
    """When retrieve returns [], get_retrieved_context returns ''."""
    mock_store.similarity_search.return_value = []
    result = get_retrieved_context("query", mock_store)
    assert result == ""
    mock_store.similarity_search.assert_called_once()

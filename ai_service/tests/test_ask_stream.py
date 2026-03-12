"""Tests for POST /ask/stream SSE endpoint."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app, get_rag_store_dep
from tests.conftest import minimal_ask_payload


@pytest.fixture
def stream_client(mock_settings, fake_rag_store):
    """TestClient with mocked dependencies for streaming tests."""

    async def fake_stream(question, context_summary, retrieved_context, *, agent=None, model=None):
        yield {"type": "delta", "content": "Hello "}
        yield {"type": "delta", "content": "world!"}

    with (
        patch("app.main.get_settings", return_value=mock_settings),
        patch("app.config.get_settings", return_value=mock_settings),
        patch("app.main.summarize_context", return_value="Summary."),
        patch("app.main.stream_answer", side_effect=fake_stream),
    ):
        app.dependency_overrides[get_rag_store_dep] = lambda: fake_rag_store
        try:
            yield TestClient(app)
        finally:
            app.dependency_overrides.clear()


def test_ask_stream_returns_sse_events(stream_client):
    """POST /ask/stream returns SSE text/event-stream with delta events."""
    payload = minimal_ask_payload()
    with stream_client.stream("POST", "/ask/stream", json=payload) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        assert len(events) >= 2
        assert events[0]["type"] == "delta"
        assert events[0]["content"] == "Hello "
        assert events[1]["content"] == "world!"


def test_ask_stream_blank_question_returns_422(stream_client):
    """POST /ask/stream with blank question returns 422."""
    payload = {**minimal_ask_payload(), "question": "   "}
    response = stream_client.post("/ask/stream", json=payload)
    assert response.status_code == 422


def test_ask_stream_no_api_key_returns_503(client_no_api_key):
    """POST /ask/stream without API key returns 503."""
    response = client_no_api_key.post("/ask/stream", json=minimal_ask_payload())
    assert response.status_code == 503

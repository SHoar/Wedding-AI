"""Tests for POST /ask."""

from tests.conftest import minimal_ask_payload


def test_ask_returns_answer_and_model(client):
    """POST /ask with valid payload returns 200 with answer and model."""
    response = client.post("/ask", json=minimal_ask_payload())
    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "Mocked answer."
    assert data["model"] == "gpt-5-nano"
    assert data.get("context_summary") is not None


def test_ask_blank_question_returns_422(client):
    """POST /ask with blank question returns 422."""
    payload = {**minimal_ask_payload(), "question": "   "}
    response = client.post("/ask", json=payload)
    assert response.status_code == 422
    assert "blank" in response.json().get("detail", [])


def test_ask_missing_wedding_returns_422(client):
    """POST /ask without wedding returns 422."""
    payload = {
        "question": "Hi?",
        "guests": [],
        "tasks": [],
        "guestbook_entries": [],
    }
    response = client.post("/ask", json=payload)
    assert response.status_code == 422


def test_ask_no_api_key_returns_503(client_no_api_key):
    """POST /ask when OPENAI_API_KEY is not set returns 503."""
    response = client_no_api_key.post("/ask", json=minimal_ask_payload())
    assert response.status_code == 503
    assert "OPENAI_API_KEY" in response.json().get("detail", "")

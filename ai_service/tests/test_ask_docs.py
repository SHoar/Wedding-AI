"""Tests for POST /ask_docs."""


def test_ask_docs_returns_answer_and_model(client):
    """POST /ask_docs with valid question returns 200 with answer and model."""
    response = client.post("/ask_docs", json={"question": "What does the dashboard show?"})
    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "Mocked answer."
    assert data["model"] == "gpt-5-nano"
    assert "documentation" in (data.get("context_summary") or "").lower()


def test_ask_docs_blank_question_returns_422(client):
    """POST /ask_docs with blank question returns 422."""
    response = client.post("/ask_docs", json={"question": "   "})
    assert response.status_code == 422


def test_ask_docs_no_api_key_returns_503(client_no_api_key):
    """POST /ask_docs when OPENAI_API_KEY is not set returns 503."""
    response = client_no_api_key.post(
        "/ask_docs", json={"question": "What does the dashboard show?"}
    )
    assert response.status_code == 503

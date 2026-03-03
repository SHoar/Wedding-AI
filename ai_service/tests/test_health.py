"""Tests for GET /health and GET /rag/status."""


def test_health_returns_ok_and_model(client):
    """GET /health returns 200 with status ok and model name."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model"] == "gpt-5-nano"


def test_rag_status_returns_version_and_count(client):
    """GET /rag/status returns index_version and doc_count (may be null if no manifest)."""
    response = client.get("/rag/status")
    assert response.status_code == 200
    data = response.json()
    assert "index_version" in data
    assert "doc_count" in data

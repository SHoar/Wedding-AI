"""Tests for GET /health."""


def test_health_returns_ok_and_model(client):
    """GET /health returns 200 with status ok and model name."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model"] == "gpt-5-nano"

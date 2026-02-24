"""Tests for build_context_markdown."""

from app.schemas import AskRequest, GuestContext, TaskContext, WeddingContext
from app.services.context import build_context_markdown


def test_build_context_markdown_minimal():
    """Minimal AskRequest produces markdown with wedding name and no guests/tasks."""
    payload = AskRequest(
        question="Hi?",
        wedding=WeddingContext(id=1, name="My Wedding", date=None, venue_name=None),
        guests=[],
        tasks=[],
        guestbook_entries=[],
    )
    md = build_context_markdown(payload)
    assert "Wedding: My Wedding" in md
    assert "Date:" in md
    assert "Venue:" in md
    assert "No guest records provided" in md
    assert "No tasks provided" in md
    assert "No guestbook entries provided" in md


def test_build_context_markdown_with_guests_and_tasks():
    """Payload with guests and tasks includes them in markdown."""
    payload = AskRequest(
        question="Who?",
        wedding=WeddingContext(id=1, name="Test", date="2025-06-01", venue_name="Venue A"),
        guests=[
            GuestContext(
                id=1,
                name="Alice",
                email="alice@example.com",
                phone=None,
                plus_one_count=1,
                dietary_notes="Vegetarian",
            )
        ],
        tasks=[TaskContext(id=1, title="Book caterer", status="pending", priority="high")],
        guestbook_entries=[],
    )
    md = build_context_markdown(payload)
    assert "Alice" in md
    assert "alice@example.com" in md
    assert "Vegetarian" in md
    assert "Book caterer" in md
    assert "pending" in md
    assert "high" in md

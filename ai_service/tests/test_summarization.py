"""Tests for normalize_llm_content."""

from app.services.summarization import normalize_llm_content


def test_normalize_llm_content_none():
    """None returns empty string."""
    assert normalize_llm_content(None) == ""


def test_normalize_llm_content_string():
    """String is returned as-is."""
    assert normalize_llm_content("hello") == "hello"


def test_normalize_llm_content_list_of_text_dicts():
    """List of dicts with 'text' key returns concatenated text."""
    assert normalize_llm_content([{"text": "a"}, {"text": "b"}]) == "a b"


def test_normalize_llm_content_list_mixed():
    """List with non-dict items converts to string."""
    result = normalize_llm_content([{"text": "x"}, "y"])
    assert "x" in result and "y" in result


def test_normalize_llm_content_other():
    """Other types are stringified."""
    assert normalize_llm_content(123) == "123"

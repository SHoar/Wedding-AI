"""Tests for retrieval helper functions: _pick_k, _source_filter, _rrf_merge."""

from unittest.mock import MagicMock

import pytest
from langchain_core.documents import Document

from app.retrieval import _pick_k, _rrf_merge, _source_filter


@pytest.fixture
def mock_settings_helpers(monkeypatch):
    s = MagicMock()
    s.rag_top_k = 5
    s.rag_top_k_min = 3
    s.rag_top_k_max = 8
    monkeypatch.setattr("app.retrieval.get_settings", lambda: s)
    return s


class TestPickK:
    def test_returns_max_for_summarize(self, mock_settings_helpers):
        assert _pick_k("summarize all guests") == 8

    def test_returns_max_for_list(self, mock_settings_helpers):
        assert _pick_k("list each task") == 8

    def test_returns_max_for_all(self, mock_settings_helpers):
        assert _pick_k("show all entries") == 8

    def test_returns_min_for_short_question(self, mock_settings_helpers):
        assert _pick_k("who?") == 3

    def test_returns_default_for_normal_question(self, mock_settings_helpers):
        assert _pick_k("what time should guests arrive for the ceremony") == 5

    def test_returns_min_for_empty(self, mock_settings_helpers):
        assert _pick_k("") == 3

    def test_returns_min_for_none(self, mock_settings_helpers):
        assert _pick_k(None) == 3

    def test_clamps_to_max(self, mock_settings_helpers):
        mock_settings_helpers.rag_top_k = 20
        assert _pick_k("what time should guests arrive for the ceremony") == 8


class TestSourceFilter:
    def test_returns_guests_md_for_guest_keyword(self):
        assert _source_filter("how do i add a guest?") == {"source": "guests.md"}

    def test_returns_tasks_md_for_tasks_keyword(self):
        assert _source_filter("how do i manage tasks?") == {"source": "tasks.md"}

    def test_returns_dashboard_md(self):
        assert _source_filter("what is on the dashboard?") == {"source": "dashboard.md"}

    def test_returns_guestbook_md(self):
        assert _source_filter("guestbook entries") == {"source": "guestbook.md"}

    def test_returns_ai_qa_md(self):
        assert _source_filter("how does ai work?") == {"source": "ai-qa.md"}

    def test_returns_none_for_unmatched(self):
        assert _source_filter("what is the weather?") is None

    def test_returns_none_for_empty(self):
        assert _source_filter("") is None

    def test_returns_none_for_none(self):
        assert _source_filter(None) is None


class TestRRFMerge:
    def test_merges_two_lists(self):
        doc_a = Document(page_content="A", metadata={})
        doc_b = Document(page_content="B", metadata={})
        doc_c = Document(page_content="C", metadata={})

        result = _rrf_merge([[doc_a, doc_b], [doc_b, doc_c]])
        contents = [d.page_content for d in result]
        assert "B" in contents
        assert "A" in contents
        assert "C" in contents
        assert contents[0] == "B"

    def test_deduplicates_by_content(self):
        doc1 = Document(page_content="Same", metadata={"source": "a.md"})
        doc2 = Document(page_content="Same", metadata={"source": "b.md"})

        result = _rrf_merge([[doc1], [doc2]])
        assert len(result) == 1

    def test_handles_empty_lists(self):
        result = _rrf_merge([[], []])
        assert result == []

    def test_single_list(self):
        doc = Document(page_content="Only", metadata={})
        result = _rrf_merge([[doc]])
        assert len(result) == 1
        assert result[0].page_content == "Only"

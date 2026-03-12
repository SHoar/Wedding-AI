"""Tests for Q&A module: prompt building, agent caching, model switching."""

from unittest.mock import MagicMock, patch

from app.services.qa import _build_prompt, get_qa_agent
import app.services.qa as qa_mod


class TestBuildPrompt:
    def test_includes_question(self):
        prompt = _build_prompt("How many?", "context here", "docs here")
        assert "How many?" in prompt

    def test_includes_context_summary(self):
        prompt = _build_prompt("q", "Wedding summary", "docs")
        assert "Wedding summary" in prompt

    def test_includes_retrieved_context(self):
        prompt = _build_prompt("q", "summary", "Relevant documentation:\n- chunk")
        assert "Relevant documentation" in prompt

    def test_placeholder_when_no_docs(self):
        prompt = _build_prompt("q", "summary", "")
        assert "No additional documentation provided" in prompt

    def test_strips_whitespace(self):
        prompt = _build_prompt("  q  ", "  summary  ", "  docs  ")
        assert "  q  " not in prompt
        assert "q" in prompt


class TestGetQaAgent:
    def setup_method(self):
        qa_mod._default_agent = None
        qa_mod._default_agent_model = None

    def test_creates_agent_on_first_call(self):
        with patch("app.services.qa.create_qa_agent") as mock_create:
            mock_create.return_value = MagicMock()
            agent = get_qa_agent(model="test-model")
            mock_create.assert_called_once_with(model="test-model")
            assert agent is not None

    def test_returns_cached_agent_for_same_model(self):
        with patch("app.services.qa.create_qa_agent") as mock_create:
            mock_create.return_value = MagicMock()
            agent1 = get_qa_agent(model="test-model")
            agent2 = get_qa_agent(model="test-model")
            assert agent1 is agent2
            assert mock_create.call_count == 1

    def test_recreates_agent_when_model_changes(self):
        with patch("app.services.qa.create_qa_agent") as mock_create:
            mock_create.return_value = MagicMock()
            agent1 = get_qa_agent(model="model-a")
            mock_create.return_value = MagicMock()
            agent2 = get_qa_agent(model="model-b")
            assert agent1 is not agent2
            assert mock_create.call_count == 2

"""Tests for the cache module: key generation, serialization, and backends."""

import json
from unittest.mock import MagicMock, patch

import pytest

from app.cache import (
    MemoryRagCacheBackend,
    MemoryResponseCacheBackend,
    _rag_cache_key,
    deserialize_ask_response,
    get_rag_cache_backend,
    response_cache_key_ask,
    response_cache_key_ask_docs,
    serialize_ask_response,
)


class TestCacheKeys:
    def test_response_cache_key_ask_is_deterministic(self):
        key1 = response_cache_key_ask("hello", "abc123")
        key2 = response_cache_key_ask("hello", "abc123")
        assert key1 == key2
        assert "hello" in key1
        assert "abc123" in key1

    def test_response_cache_key_ask_varies_by_question(self):
        key1 = response_cache_key_ask("hello", "abc")
        key2 = response_cache_key_ask("world", "abc")
        assert key1 != key2

    def test_response_cache_key_ask_docs_is_deterministic(self):
        key1 = response_cache_key_ask_docs("hello")
        key2 = response_cache_key_ask_docs("hello")
        assert key1 == key2
        assert "hello" in key1

    def test_rag_cache_key_includes_question_and_k(self):
        key = _rag_cache_key("how to add?", 5)
        assert "how to add?" in key
        assert "5" in key

    def test_rag_cache_key_strips_whitespace(self):
        key1 = _rag_cache_key("  hello  ", 3)
        key2 = _rag_cache_key("hello", 3)
        assert key1 == key2


class TestSerialization:
    def test_roundtrip(self):
        data = {"answer": "42", "model": "gpt-5-nano", "context_summary": "sum"}
        raw = serialize_ask_response(data)
        restored = deserialize_ask_response(raw)
        assert restored == data

    def test_serialize_returns_json_string(self):
        data = {"answer": "test"}
        raw = serialize_ask_response(data)
        assert isinstance(raw, str)
        assert json.loads(raw) == data


class TestMemoryResponseCacheBackend:
    @pytest.mark.asyncio
    async def test_get_returns_none_when_empty(self):
        backend = MemoryResponseCacheBackend(maxsize=10, ttl_seconds=60)
        assert await backend.get("missing") is None

    @pytest.mark.asyncio
    async def test_set_and_get(self):
        backend = MemoryResponseCacheBackend(maxsize=10, ttl_seconds=60)
        await backend.set("k", "v", 60)
        assert await backend.get("k") == "v"


class TestMemoryRagCacheBackend:
    def test_get_returns_none_when_empty(self):
        backend = MemoryRagCacheBackend(ttl_seconds=60)
        assert backend.get("missing") is None

    def test_set_and_get(self):
        backend = MemoryRagCacheBackend(ttl_seconds=60)
        backend.set("k", "v", 60)
        assert backend.get("k") == "v"


class TestGetRagCacheBackend:
    def test_returns_none_when_ttl_zero(self):
        import app.cache as cache_mod

        cache_mod._rag_backend_initialized = False
        cache_mod._rag_backend = None
        settings = MagicMock()
        settings.rag_cache_ttl_seconds = 0
        settings.redis_url_stripped = ""
        with patch("app.cache.get_settings", return_value=settings):
            result = get_rag_cache_backend()
        assert result is None
        cache_mod._rag_backend_initialized = False

    def test_returns_memory_backend_when_no_redis(self):
        import app.cache as cache_mod

        cache_mod._rag_backend_initialized = False
        cache_mod._rag_backend = None
        settings = MagicMock()
        settings.rag_cache_ttl_seconds = 300
        settings.redis_url_stripped = ""
        with patch("app.cache.get_settings", return_value=settings):
            result = get_rag_cache_backend()
        assert isinstance(result, MemoryRagCacheBackend)
        cache_mod._rag_backend_initialized = False

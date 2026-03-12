"""
Response and RAG cache backends: in-memory (TTLCache) or Redis when REDIS_URL is set.
"""

import asyncio
import json
from typing import Any

from app.config import get_settings


class AsyncResponseCacheBackend:
    """Async interface for response cache: get(key) -> value or None, set(key, value, ttl_seconds)."""

    async def get(self, key: str) -> str | None:
        raise NotImplementedError

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        raise NotImplementedError


class MemoryResponseCacheBackend(AsyncResponseCacheBackend):
    """In-memory TTL cache; keys are stringified for consistency (e.g. json.dumps of tuple)."""

    def __init__(self, maxsize: int = 500, ttl_seconds: int = 60):
        from cachetools import TTLCache

        self._cache: TTLCache = TTLCache(maxsize=maxsize, ttl=ttl_seconds)
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> str | None:
        async with self._lock:
            return self._cache.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        async with self._lock:
            self._cache[key] = value


class RedisResponseCacheBackend(AsyncResponseCacheBackend):
    """Redis-backed cache. Uses redis.asyncio. Fails open: on Redis error, get returns None, set no-ops."""

    def __init__(self, url: str, default_ttl: int = 60):
        self._url = url
        self._default_ttl = default_ttl
        self._client: Any = None

    async def _get_client(self):
        if self._client is None:
            from redis.asyncio import from_url

            self._client = from_url(self._url, decode_responses=True)
        return self._client

    async def get(self, key: str) -> str | None:
        try:
            client = await self._get_client()
            return await client.get(key)
        except Exception:
            return None

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        try:
            client = await self._get_client()
            await client.set(key, value, ex=ttl_seconds or self._default_ttl)
        except Exception:
            pass


_response_backend: AsyncResponseCacheBackend | None = None
_response_backend_lock = asyncio.Lock()


async def get_response_cache_backend() -> AsyncResponseCacheBackend | None:
    """Return the response cache backend if caching is enabled, else None."""
    global _response_backend
    settings = get_settings()
    if settings.cache_ttl_seconds <= 0:
        return None
    async with _response_backend_lock:
        if _response_backend is None:
            if settings.redis_url_stripped:
                _response_backend = RedisResponseCacheBackend(
                    settings.redis_url_stripped, default_ttl=settings.cache_ttl_seconds
                )
            else:
                _response_backend = MemoryResponseCacheBackend(
                    maxsize=500, ttl_seconds=settings.cache_ttl_seconds
                )
        return _response_backend


def response_cache_key_ask(question: str, context_hash: str) -> str:
    """Stable string key for /ask cache."""
    return f"ask:{question}:{context_hash}"


def response_cache_key_ask_docs(question: str) -> str:
    """Stable string key for /ask_docs cache."""
    return f"ask_docs:{question}"


def serialize_ask_response(data: dict[str, Any]) -> str:
    """Serialize AskResponse-like dict to JSON for cache storage."""
    return json.dumps(data)


def deserialize_ask_response(raw: str) -> dict[str, Any]:
    """Deserialize cached JSON to dict for AskResponse.model_validate."""
    return json.loads(raw)


# --- RAG cache (question -> formatted context string) ---

def _rag_cache_key(question: str, k: int) -> str:
    return f"rag:{question.strip()}:{k}"


_rag_backend: "RagCacheBackend | None" = None
_rag_backend_initialized: bool = False


def get_rag_cache_backend() -> "RagCacheBackend | None":
    """Return RAG cache backend if RAG_CACHE_TTL_SECONDS > 0, else None (cached singleton)."""
    global _rag_backend, _rag_backend_initialized
    if _rag_backend_initialized:
        return _rag_backend
    settings = get_settings()
    if settings.rag_cache_ttl_seconds <= 0:
        _rag_backend = None
    elif settings.redis_url_stripped:
        _rag_backend = RedisRagCacheBackend(settings.redis_url_stripped, settings.rag_cache_ttl_seconds)
    else:
        _rag_backend = MemoryRagCacheBackend(settings.rag_cache_ttl_seconds)
    _rag_backend_initialized = True
    return _rag_backend


class RagCacheBackend:
    """Sync interface for RAG context cache: get(key) -> str | None, set(key, context_str)."""

    def get(self, key: str) -> str | None:
        raise NotImplementedError

    def set(self, key: str, value: str, ttl_seconds: int) -> None:
        raise NotImplementedError


class MemoryRagCacheBackend(RagCacheBackend):
    """In-memory TTL cache for RAG context string."""

    def __init__(self, ttl_seconds: int):
        from cachetools import TTLCache

        self._cache: TTLCache = TTLCache(maxsize=1000, ttl=ttl_seconds)

    def get(self, key: str) -> str | None:
        return self._cache.get(key)

    def set(self, key: str, value: str, ttl_seconds: int) -> None:
        self._cache[key] = value


class RedisRagCacheBackend(RagCacheBackend):
    """Redis-backed RAG cache. Sync for use from thread. Stores formatted context string."""

    def __init__(self, url: str, default_ttl: int):
        self._url = url
        self._default_ttl = default_ttl
        self._client: Any = None

    def _get_client(self):
        if self._client is None:
            import redis

            self._client = redis.from_url(self._url, decode_responses=True)
        return self._client

    def get(self, key: str) -> str | None:
        try:
            client = self._get_client()
            raw = client.get(key)
            if raw is None:
                return None
            if isinstance(raw, str):
                return raw
            return str(raw)
        except Exception:
            return None

    def set(self, key: str, value: str, ttl_seconds: int) -> None:
        try:
            client = self._get_client()
            client.set(key, value, ex=ttl_seconds or self._default_ttl)
        except Exception:
            pass

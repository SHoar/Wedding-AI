"""FastAPI application: routes, lifespan, and dependencies."""

import asyncio
import hashlib
from pathlib import Path
from typing import Annotated

from cachetools import TTLCache
from fastapi import Depends, FastAPI, HTTPException

from app.config import get_settings
from app.retrieval import get_or_build_store, get_retrieved_context
from app.schemas import AskDocsRequest, AskRequest, AskResponse
from app.services.context import build_context_markdown
from app.services.qa import generate_answer
from app.services.summarization import summarize_context

# RAG store singleton; preloaded at startup when possible, else on first /ask
_rag_store = None

# Optional response cache (when CACHE_TTL_SECONDS > 0); asyncio.Lock avoids blocking the event loop
_response_cache: TTLCache | None = None
_cache_lock = asyncio.Lock()


async def _get_response_cache() -> TTLCache | None:
    """Return the response cache if CACHE_TTL_SECONDS > 0, else None."""
    global _response_cache
    settings = get_settings()
    if settings.cache_ttl_seconds <= 0:
        return None
    async with _cache_lock:
        if _response_cache is None:
            _response_cache = TTLCache(
                maxsize=500,
                ttl=settings.cache_ttl_seconds,
            )
    return _response_cache


def _cache_key_ask(question: str, context_markdown: str) -> tuple[str, str]:
    """Hashable cache key for /ask: (question, hash of context)."""
    h = hashlib.sha256(context_markdown.encode()).hexdigest()[:32]
    return (question.strip(), h)


def _cache_key_ask_docs(question: str) -> str:
    """Cache key for /ask_docs."""
    return question.strip()


def _get_rag_store():
    global _rag_store
    if _rag_store is None:
        settings = get_settings()
        _rag_store = get_or_build_store(Path(settings.docs_dir))
    return _rag_store


def get_rag_store_dep():
    """FastAPI dependency: return the RAG store (for DI in tests)."""
    return _get_rag_store()


async def _lifespan(app: FastAPI):
    """Start RAG store build in background so it is often ready before first /ask."""

    def build_store():
        global _rag_store
        try:
            settings = get_settings()
            _rag_store = get_or_build_store(Path(settings.docs_dir))
        except Exception:
            pass

    asyncio.create_task(asyncio.to_thread(build_store))
    yield


def require_api_key() -> None:
    """Raise 503 if OPENAI_API_KEY is not set."""
    if not get_settings().openai_api_key_stripped:
        raise HTTPException(
            status_code=503,
            detail=(
                "OPENAI_API_KEY is not set. For Docker: add OPENAI_API_KEY=sk-... to a .env file "
                "in the project root (next to docker-compose.yml), then run: docker compose up --build"
            ),
        )


app = FastAPI(
    title="Wedding AI Service",
    version="1.0.0",
    description="LangChain + PydanticAI service for wedding coordination Q&A.",
    lifespan=_lifespan,
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": get_settings().openai_model}


@app.post("/ask", response_model=AskResponse)
async def ask(
    payload: AskRequest,
    store: Annotated[object, Depends(get_rag_store_dep)],
) -> AskResponse:
    require_api_key()
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be blank.")

    settings = get_settings()
    context_markdown = build_context_markdown(payload)
    cache = await _get_response_cache()
    if cache is not None:
        key = _cache_key_ask(question, context_markdown)
        async with _cache_lock:
            if key in cache:
                return cache[key]

    try:
        context_summary, retrieved_context = await asyncio.gather(
            asyncio.to_thread(
                summarize_context,
                context_markdown,
                settings.openai_model,
                settings.ai_http_timeout,
            ),
            asyncio.to_thread(get_retrieved_context, payload.question, store),
        )
        answer = await generate_answer(
            question,
            context_summary,
            retrieved_context,
            model=settings.openai_model,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc

    if not answer:
        raise HTTPException(status_code=502, detail="AI returned an empty answer.")

    response = AskResponse(
        answer=answer,
        model=settings.openai_model,
        context_summary=context_summary or None,
    )
    if cache is not None:
        key = _cache_key_ask(question, context_markdown)
        async with _cache_lock:
            cache[key] = response
    return response


@app.post("/ask_docs", response_model=AskResponse)
async def ask_docs(
    payload: AskDocsRequest,
    store: Annotated[object, Depends(get_rag_store_dep)],
) -> AskResponse:
    """Answer using only the RAG documentation (no wedding/guests/tasks/guestbook context)."""
    require_api_key()
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be blank.")

    settings = get_settings()
    cache = await _get_response_cache()
    if cache is not None:
        key = _cache_key_ask_docs(question)
        async with _cache_lock:
            if key in cache:
                return cache[key]

    context_summary = "No live wedding data provided; answer from documentation only."
    try:
        retrieved_context = await asyncio.to_thread(get_retrieved_context, question, store)
        answer = await generate_answer(
            question,
            context_summary,
            retrieved_context,
            model=settings.openai_model,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc

    if not answer:
        raise HTTPException(status_code=502, detail="AI returned an empty answer.")

    response = AskResponse(
        answer=answer,
        model=settings.openai_model,
        context_summary=context_summary,
    )
    if cache is not None:
        key = _cache_key_ask_docs(question)
        async with _cache_lock:
            cache[key] = response
    return response

"""FastAPI application: routes, lifespan, and dependencies."""

import asyncio
import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.responses import StreamingResponse
from prometheus_client import CONTENT_TYPE_LATEST, Histogram, generate_latest

from app.cache import (
    deserialize_ask_response,
    get_response_cache_backend,
    response_cache_key_ask,
    response_cache_key_ask_docs,
    serialize_ask_response,
)
from app.config import get_settings
from app.index_manager import load_manifest as get_rag_manifest
from app.retrieval import get_or_build_store, get_retrieved_context_cached
from app.schemas import AskDocsRequest, AskRequest, AskResponse
from app.services.context import build_context_markdown
from app.services.qa import generate_answer, stream_answer
from app.services.summarization import summarize_context

logger = logging.getLogger(__name__)

# Prometheus histogram for per-step and total request duration (seconds)
REQUEST_DURATION = Histogram(
    "ai_request_duration_seconds",
    "Request step duration in seconds",
    ["route", "step"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

# RAG store singleton; preloaded at startup when possible, else on first /ask
_rag_store = None


def _context_hash(context_markdown: str) -> str:
    """Stable hash of context for cache key."""
    return hashlib.sha256(context_markdown.encode()).hexdigest()[:32]


def _server_timing_header(entries: dict[str, float]) -> str:
    """Build a Server-Timing header value from name -> duration_ms entries."""
    return "; ".join(f"{name}, dur={round(ms, 2)}" for name, ms in entries.items())


def _log_timing(route: str, **ms_entries: float) -> None:
    """Log one structured line with duration fields for observability."""
    logger.info(
        "ai_request_timing",
        extra={"route": route, **{f"{k}_ms": v for k, v in ms_entries.items()}},
    )


def _record_metrics(route: str, **ms_entries: float) -> None:
    """Record Prometheus histogram for each step duration (seconds)."""
    for step, ms in ms_entries.items():
        REQUEST_DURATION.labels(route=route, step=step).observe(ms / 1000.0)


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
    """Start RAG store build in background; optionally run periodic index refresh."""

    def build_store():
        global _rag_store
        try:
            settings = get_settings()
            _rag_store = get_or_build_store(Path(settings.docs_dir))
        except Exception:
            pass

    asyncio.create_task(asyncio.to_thread(build_store))

    async def refresh_index_if_needed():
        from pathlib import Path

        from app.index_manager import needs_rebuild, rebuild
        from app.retrieval import _load_docs_from_dir, set_bm25_docs

        interval = get_settings().rag_auto_refresh_interval_seconds
        if interval <= 0:
            return
        while True:
            await asyncio.sleep(interval)
            try:
                store = _get_rag_store()
                if store is None:
                    continue
                docs_dir = Path(get_settings().docs_dir)
                if needs_rebuild(docs_dir):
                    _n, docs = await asyncio.to_thread(
                        rebuild, store, docs_dir, _load_docs_from_dir
                    )
                    set_bm25_docs(docs)
            except asyncio.CancelledError:
                break
            except Exception:
                pass

    refresh_task = asyncio.create_task(refresh_index_if_needed())
    try:
        yield
    finally:
        refresh_task.cancel()
        try:
            await refresh_task
        except asyncio.CancelledError:
            pass


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


@app.get("/rag/status")
def rag_status() -> dict[str, str | int | None]:
    """Return RAG index version and doc count for debugging."""
    manifest = get_rag_manifest()
    if manifest is None:
        return {"index_version": None, "doc_count": None}
    return {
        "index_version": manifest.get("index_version"),
        "doc_count": manifest.get("doc_count"),
    }


@app.get("/metrics")
def metrics() -> Response:
    """Prometheus scrape endpoint for request duration and step histograms."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/ask", response_model=AskResponse)
async def ask(
    response: Response,
    payload: AskRequest,
    store: Annotated[object, Depends(get_rag_store_dep)],
) -> AskResponse:
    require_api_key()
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be blank.")

    t0 = time.perf_counter()
    settings = get_settings()
    context_markdown = build_context_markdown(payload)
    context_ms = (time.perf_counter() - t0) * 1000

    cache_backend = await get_response_cache_backend()
    if cache_backend is not None:
        key = response_cache_key_ask(question, _context_hash(context_markdown))
        raw = await cache_backend.get(key)
        if raw is not None:
            total_ms = (time.perf_counter() - t0) * 1000
            response.headers["Server-Timing"] = _server_timing_header(
                {"context": context_ms, "cache_hit": 0, "total": total_ms}
            )
            _log_timing("ask", context=context_ms, cache_hit=0, total=total_ms)
            _record_metrics("ask", context=context_ms, cache_hit=0, total=total_ms)
            return AskResponse.model_validate(deserialize_ask_response(raw))

    try:
        t_fetch = time.perf_counter()
        summarization_model = settings.openai_summarization_model or settings.openai_model
        qa_model = settings.openai_qa_model or settings.openai_model
        context_summary, retrieved_context = await asyncio.gather(
            asyncio.to_thread(
                summarize_context,
                context_markdown,
                summarization_model,
                settings.ai_http_timeout,
            ),
            asyncio.to_thread(get_retrieved_context_cached, payload.question, store),
        )
        fetch_ms = (time.perf_counter() - t_fetch) * 1000

        t_qa = time.perf_counter()
        answer = await generate_answer(
            question,
            context_summary,
            retrieved_context,
            model=qa_model,
        )
        qa_ms = (time.perf_counter() - t_qa) * 1000
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc

    if not answer:
        raise HTTPException(status_code=502, detail="AI returned an empty answer.")

    total_ms = (time.perf_counter() - t0) * 1000
    response.headers["Server-Timing"] = _server_timing_header(
        {"context": context_ms, "summarize_rag": fetch_ms, "qa": qa_ms, "total": total_ms}
    )
    _log_timing("ask", context=context_ms, summarize_rag=fetch_ms, qa=qa_ms, total=total_ms)
    _record_metrics("ask", context=context_ms, summarize_rag=fetch_ms, qa=qa_ms, total=total_ms)

    result = AskResponse(
        answer=answer,
        model=qa_model,
        context_summary=context_summary or None,
    )
    if cache_backend is not None:
        key = response_cache_key_ask(question, _context_hash(context_markdown))
        await cache_backend.set(
            key, serialize_ask_response(result.model_dump()), settings.cache_ttl_seconds
        )
    return result


@app.post("/ask/stream")
async def ask_stream(
    payload: AskRequest,
    store: Annotated[object, Depends(get_rag_store_dep)],
) -> StreamingResponse:
    """Stream answer tokens as SSE. Same input as POST /ask."""
    require_api_key()
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be blank.")

    settings = get_settings()
    context_markdown = build_context_markdown(payload)
    summarization_model = settings.openai_summarization_model or settings.openai_model
    qa_model = settings.openai_qa_model or settings.openai_model

    try:
        context_summary, retrieved_context = await asyncio.gather(
            asyncio.to_thread(
                summarize_context,
                context_markdown,
                summarization_model,
                settings.ai_http_timeout,
            ),
            asyncio.to_thread(get_retrieved_context_cached, question, store),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc

    async def event_stream():
        async for chunk in stream_answer(
            question, context_summary or "", retrieved_context or "", model=qa_model
        ):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/ask_docs", response_model=AskResponse)
async def ask_docs(
    response: Response,
    payload: AskDocsRequest,
    store: Annotated[object, Depends(get_rag_store_dep)],
) -> AskResponse:
    """Answer using only the RAG documentation (no wedding/guests/tasks/guestbook context)."""
    require_api_key()
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be blank.")

    t0 = time.perf_counter()
    settings = get_settings()
    cache_backend = await get_response_cache_backend()
    if cache_backend is not None:
        key = response_cache_key_ask_docs(question)
        raw = await cache_backend.get(key)
        if raw is not None:
            total_ms = (time.perf_counter() - t0) * 1000
            response.headers["Server-Timing"] = _server_timing_header(
                {"cache_hit": 0, "total": total_ms}
            )
            _log_timing("ask_docs", cache_hit=0, total=total_ms)
            _record_metrics("ask_docs", cache_hit=0, total=total_ms)
            return AskResponse.model_validate(deserialize_ask_response(raw))

    context_summary = "No live wedding data provided; answer from documentation only."
    qa_model = settings.openai_qa_model or settings.openai_model
    try:
        t_rag = time.perf_counter()
        retrieved_context = await asyncio.to_thread(get_retrieved_context_cached, question, store)
        rag_ms = (time.perf_counter() - t_rag) * 1000

        t_qa = time.perf_counter()
        answer = await generate_answer(
            question,
            context_summary,
            retrieved_context,
            model=qa_model,
        )
        qa_ms = (time.perf_counter() - t_qa) * 1000
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc

    if not answer:
        raise HTTPException(status_code=502, detail="AI returned an empty answer.")

    total_ms = (time.perf_counter() - t0) * 1000
    response.headers["Server-Timing"] = _server_timing_header(
        {"rag": rag_ms, "qa": qa_ms, "total": total_ms}
    )
    _log_timing("ask_docs", rag=rag_ms, qa=qa_ms, total=total_ms)
    _record_metrics("ask_docs", rag=rag_ms, qa=qa_ms, total=total_ms)

    result = AskResponse(
        answer=answer,
        model=qa_model,
        context_summary=context_summary,
    )
    if cache_backend is not None:
        key = response_cache_key_ask_docs(question)
        await cache_backend.set(
            key, serialize_ask_response(result.model_dump()), settings.cache_ttl_seconds
        )
    return result

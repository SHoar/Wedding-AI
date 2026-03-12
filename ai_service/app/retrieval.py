"""
RAG retrieval for Wedding AI: embed docs from docs/ and query with Chroma.
Supports hybrid search (Chroma + BM25), optional Cohere rerank, metadata filters, adaptive k.
"""

import logging
from pathlib import Path

from langchain_chroma import Chroma
from prometheus_client import Counter
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings

logger = logging.getLogger(__name__)

# Collection and persistence
COLLECTION_NAME = "wedding_ai_docs"

# RAG observability
RAG_RETRIEVAL_TOTAL = Counter("rag_retrieval_total", "Total RAG retrievals")
RAG_CACHE_HITS_TOTAL = Counter("rag_cache_hits_total", "RAG cache hits")
RAG_CACHE_MISSES_TOTAL = Counter("rag_cache_misses_total", "RAG cache misses")

# BM25 in-memory retriever (set when index is built/rebuilt)
_bm25_retriever: BM25Retriever | None = None
_RRF_K = 60


def _get_index_manager():
    from app.index_manager import (
        _current_doc_hashes,
        load_manifest,
        needs_rebuild,
        rebuild,
        save_manifest,
    )
    return load_manifest, needs_rebuild, rebuild, save_manifest, _current_doc_hashes


def get_embedding_model() -> OpenAIEmbeddings:
    """Return OpenAI embeddings using settings (OPENAI_API_KEY, timeout, model)."""
    s = get_settings()
    return OpenAIEmbeddings(
        model=s.openai_embedding_model,
        openai_api_key=s.openai_api_key_stripped or None,
        request_timeout=s.ai_http_timeout,
    )


def _chunk_markdown_with_splitter(content: str, source: str) -> list[Document]:
    """
    Split markdown by ## headers, then split each section with RecursiveCharacterTextSplitter.
    Each chunk gets metadata: source, heading, page (section index).
    """
    settings = get_settings()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""],
    )
    sections = content.split("\n## ")
    docs: list[Document] = []
    for i, section in enumerate(sections):
        section = section.strip()
        if not section:
            continue
        lines = section.split("\n")
        heading = lines[0].strip().lstrip("#").strip() if lines else ""
        text = section if i == 0 else "## " + section
        sub_chunks = splitter.split_text(text)
        for chunk_text in sub_chunks:
            if not chunk_text.strip():
                continue
            docs.append(
                Document(
                    page_content=chunk_text,
                    metadata={"source": source, "heading": heading, "page": i},
                )
            )
    return docs


def _load_docs_from_dir(docs_dir: Path) -> list[Document]:
    """Scan docs_dir for *.md, chunk with RecursiveCharacterTextSplitter, return list of Documents."""
    all_docs: list[Document] = []
    if not docs_dir.is_dir():
        return all_docs
    for path in sorted(docs_dir.glob("*.md")):
        try:
            content = path.read_text(encoding="utf-8")
        except Exception:
            continue
        source = path.name
        all_docs.extend(_chunk_markdown_with_splitter(content, source))
    return all_docs


def get_or_build_store(docs_dir: Path | None = None) -> Chroma | None:
    """
    Return a Chroma vector store for wedding_ai_docs. If the collection is empty
    and docs_dir has Markdown files, index them. Uses OPENAI_API_KEY for embeddings.
    Returns None if OPENAI_API_KEY is missing or docs_dir is missing/empty when store is empty.
    """
    s = get_settings()
    if not s.openai_api_key_stripped:
        return None

    persist_path = Path(s.chroma_persist_dir)
    persist_path.mkdir(parents=True, exist_ok=True)
    embed = get_embedding_model()

    store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embed,
        persist_directory=str(persist_path),
    )

    dir_path = docs_dir or Path(s.docs_dir)
    load_manifest, needs_rebuild, rebuild, save_manifest, current_doc_hashes = _get_index_manager()

    try:
        count = store._collection.count()
    except Exception:
        count = 0

    if count == 0:
        documents = _load_docs_from_dir(dir_path)
        if not documents:
            return store
        store.add_documents(documents)
        set_bm25_docs(documents)
        doc_hashes = current_doc_hashes(dir_path)
        if doc_hashes:
            save_manifest(doc_hashes, len(documents))
    elif needs_rebuild(dir_path):
        _n, docs = rebuild(store, dir_path, _load_docs_from_dir)
        set_bm25_docs(docs)

    return store


def set_bm25_docs(documents: list[Document]) -> None:
    """Set the in-memory docs used for BM25 hybrid search (called after index build/rebuild)."""
    global _bm25_retriever
    if not documents:
        _bm25_retriever = None
        return
    try:
        _bm25_retriever = BM25Retriever.from_documents(documents)
    except Exception:
        _bm25_retriever = None


def _pick_k(question: str) -> int:
    """Adaptive k: use RAG_TOP_K_MIN..RAG_TOP_K_MAX based on question heuristics."""
    s = get_settings()
    low, high = s.rag_top_k_min, s.rag_top_k_max
    q = (question or "").strip().lower()
    if "summarize" in q or "list" in q or "all" in q or "each" in q:
        return high
    if len(q.split()) <= 3:
        return low
    return max(low, min(high, s.rag_top_k))


def _source_filter(question: str) -> dict | None:
    """Optional metadata filter by source when question implies a doc (e.g. 'guests' -> guests.md)."""
    q = (question or "").strip().lower()
    mapping = [
        ("guestbook", "guestbook.md"),
        ("guests", "guests.md"),
        ("guest", "guests.md"),
        ("tasks", "tasks.md"),
        ("task", "tasks.md"),
        ("dashboard", "dashboard.md"),
        ("ai", "ai-qa.md"),
        ("documentation", "README.md"),
    ]
    for keyword, source in mapping:
        if keyword in q:
            return {"source": source}
    return None


def _rrf_merge(doc_lists: list[list[Document]], k: int = _RRF_K) -> list[Document]:
    """Merge multiple ranked document lists using Reciprocal Rank Fusion. Dedupes by page_content."""
    scores: dict[str, float] = {}
    doc_by_content: dict[str, Document] = {}
    for docs in doc_lists:
        for rank, doc in enumerate(docs):
            content = doc.page_content
            scores[content] = scores.get(content, 0.0) + 1.0 / (k + rank + 1)
            if content not in doc_by_content:
                doc_by_content[content] = doc
    sorted_contents = sorted(scores.keys(), key=lambda c: -scores[c])
    return [doc_by_content[c] for c in sorted_contents]


def _retrieve_docs(
    question: str, store: Chroma | None, k: int | None = None
) -> list[Document]:
    """
    Return top-k Document objects (with metadata). Uses hybrid search if BM25 is available.
    """
    if not store or not (question or "").strip():
        return []
    s = get_settings()
    top_k = k if k is not None else _pick_k(question)
    fetch_k = min(2 * top_k, 20)
    meta_filter = _source_filter(question)

    try:
        if _bm25_retriever is not None:
            chroma_docs = store.similarity_search(
                question.strip(), k=fetch_k, filter=meta_filter
            )
            bm25_docs = _bm25_retriever.invoke(question.strip())[:fetch_k]
            merged = _rrf_merge([chroma_docs, bm25_docs])[:top_k]
        else:
            merged = store.similarity_search(
                question.strip(), k=top_k, filter=meta_filter
            )

        if s.rag_rerank_enabled and (s.cohere_api_key or "").strip():
            try:
                from langchain_cohere import CohereRerank

                reranker = CohereRerank(
                    cohere_api_key=s.cohere_api_key_stripped or None,
                    top_n=top_k,
                    model="rerank-multilingual-v3.0",
                )
                merged = reranker.compress_documents(question.strip(), merged)
            except Exception:
                logger.warning("rag_rerank_failed", exc_info=True)
        return merged[:top_k]
    except Exception:
        logger.error("rag_retrieval_failed", exc_info=True)
        return []


def _format_chunk_with_citation(doc: Document) -> str:
    """Format a single chunk with [Source: filename - \"heading\"] for citations."""
    source = doc.metadata.get("source") or "docs"
    heading = doc.metadata.get("heading") or ""
    label = f'[Source: {source}'
    if heading:
        label += f' - "{heading}"'
    label += "]\n"
    return label + doc.page_content


def _truncate_context(context: str, max_chars: int) -> str:
    """Truncate context to max_chars, trying to cut at a chunk boundary (---)."""
    if len(context) <= max_chars:
        return context
    truncated = context[:max_chars]
    last_sep = truncated.rfind("\n---\n\n")
    if last_sep > max_chars // 2:
        return truncated[:last_sep + 1]
    return truncated + "\n..."


def retrieve(question: str, store: Chroma | None, k: int | None = None) -> list[str]:
    """
    Return top-k relevant text chunks from the store for the given question.
    Uses hybrid search (Chroma + BM25) when BM25 is available, optional rerank.
    """
    docs = _retrieve_docs(question, store, k=k)
    return [d.page_content for d in docs]


def get_retrieved_context(question: str, store: Chroma | None, k: int | None = None) -> str:
    """Return a single string of retrieved chunks with citations for the LLM prompt."""
    docs = _retrieve_docs(question, store, k=k)
    RAG_RETRIEVAL_TOTAL.inc()
    if not docs:
        return ""
    sources = list({d.metadata.get("source") for d in docs if d.metadata.get("source")})
    logger.info("rag_retrieval", extra={"chunk_sources": sources})
    parts = [_format_chunk_with_citation(d) for d in docs]
    context = "Relevant documentation:\n\n" + "\n---\n\n".join(parts)
    return _truncate_context(context, get_settings().rag_max_context_chars)


def get_retrieved_context_cached(question: str, store: Chroma | None, k: int | None = None) -> str:
    """
    Like get_retrieved_context but with optional TTL cache (question -> formatted context string).
    When RAG_CACHE_TTL_SECONDS > 0 and REDIS_URL or in-memory cache is used, repeated
    questions return cached context and skip embedding + Chroma query.
    """
    from app.cache import _rag_cache_key, get_rag_cache_backend

    settings = get_settings()
    top_k = k if k is not None else _pick_k(question)
    key = _rag_cache_key(question, top_k)

    backend = get_rag_cache_backend()
    if backend is not None:
        cached = backend.get(key)
        if cached is not None:
            RAG_CACHE_HITS_TOTAL.inc()
            if cached == "":
                return ""
            return _truncate_context(cached, settings.rag_max_context_chars)
        RAG_CACHE_MISSES_TOTAL.inc()

    context = get_retrieved_context(question, store, k=k)
    if backend is not None:
        backend.set(key, context, settings.rag_cache_ttl_seconds)
    return context

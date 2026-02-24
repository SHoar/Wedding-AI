"""
RAG retrieval for Wedding AI: embed docs from docs/ and query with Chroma.
"""
import os
from pathlib import Path
from typing import Any

from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

# Collection and persistence
COLLECTION_NAME = "wedding_ai_docs"
DEFAULT_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
DOCS_DIR = os.getenv("DOCS_DIR", "./docs")
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def get_embedding_model() -> OpenAIEmbeddings:
    """Return OpenAI embeddings using OPENAI_API_KEY and timeout from env."""
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    timeout = float(os.getenv("AI_HTTP_TIMEOUT", "45"))
    return OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        openai_api_key=api_key or None,
        request_timeout=timeout,
    )


def _chunk_markdown_by_sections(content: str, source: str) -> list[Document]:
    """Split markdown by ## headers; each section becomes a Document with source and heading."""
    sections = content.split("\n## ")
    docs: list[Document] = []
    for i, section in enumerate(sections):
        section = section.strip()
        if not section:
            continue
        lines = section.split("\n")
        heading = lines[0].strip().lstrip("#").strip() if lines else ""
        # Rejoin so we keep the full section text (with first line as heading)
        text = section if i == 0 else "## " + section
        # Optional: cap size for very long sections (~800 chars) to keep chunks retrievable
        if len(text) > 1200:
            text = text[:1200] + "\n..."
        docs.append(
            Document(
                page_content=text,
                metadata={"source": source, "heading": heading},
            )
        )
    return docs


def _load_docs_from_dir(docs_dir: Path) -> list[Document]:
    """Scan docs_dir for *.md, chunk by section, return list of Documents."""
    all_docs: list[Document] = []
    if not docs_dir.is_dir():
        return all_docs
    for path in sorted(docs_dir.glob("*.md")):
        try:
            content = path.read_text(encoding="utf-8")
        except Exception:
            continue
        source = path.name
        all_docs.extend(_chunk_markdown_by_sections(content, source))
    return all_docs


def get_or_build_store(docs_dir: Path | None = None) -> Chroma | None:
    """
    Return a Chroma vector store for wedding_ai_docs. If the collection is empty
    and docs_dir has Markdown files, index them. Uses OPENAI_API_KEY for embeddings.
    Returns None if OPENAI_API_KEY is missing or docs_dir is missing/empty when store is empty.
    """
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        return None

    persist_path = Path(DEFAULT_PERSIST_DIR)
    persist_path.mkdir(parents=True, exist_ok=True)
    embed = get_embedding_model()

    store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embed,
        persist_directory=str(persist_path),
    )

    # Check if collection is empty (new or first run)
    try:
        count = store._collection.count()
    except Exception:
        count = 0

    if count == 0:
        dir_path = docs_dir or Path(DOCS_DIR)
        documents = _load_docs_from_dir(dir_path)
        if not documents:
            return store  # return empty store so callers can still call retrieve (no results)
        store.add_documents(documents)

    return store


def retrieve(question: str, store: Chroma | None, k: int | None = None) -> list[str]:
    """
    Return top-k relevant text chunks from the store for the given question.
    If store is None or question is empty, returns [].
    """
    if not store or not (question or "").strip():
        return []
    top_k = k if k is not None else RAG_TOP_K
    try:
        docs = store.similarity_search(question.strip(), k=top_k)
        return [d.page_content for d in docs]
    except Exception:
        return []


def get_retrieved_context(question: str, store: Chroma | None, k: int | None = None) -> str:
    """Return a single string of retrieved chunks for inclusion in the LLM prompt."""
    chunks = retrieve(question, store, k=k)
    if not chunks:
        return ""
    return "Relevant documentation:\n\n" + "\n---\n\n".join(chunks)

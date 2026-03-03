"""
Index manager: doc change detection, manifest (hashes + version), and rebuild.
"""

import hashlib
import json
import logging
from pathlib import Path
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)

MANIFEST_FILENAME = "index_manifest.json"


def _compute_file_hash(path: Path, content: str) -> str:
    """Stable hash for path + content."""
    data = f"{path.name}\n{content}"
    return hashlib.sha256(data.encode()).hexdigest()


def _current_doc_hashes(docs_dir: Path) -> dict[str, str]:
    """Compute SHA256 hash for each *.md file in docs_dir. Keys are filenames."""
    hashes: dict[str, str] = {}
    if not docs_dir.is_dir():
        return hashes
    for path in sorted(docs_dir.glob("*.md")):
        try:
            content = path.read_text(encoding="utf-8")
            hashes[path.name] = _compute_file_hash(path, content)
        except Exception:
            continue
    return hashes


def _manifest_path() -> Path:
    return Path(get_settings().chroma_persist_dir) / MANIFEST_FILENAME


def load_manifest() -> dict[str, Any] | None:
    """Load manifest from CHROMA_PERSIST_DIR if it exists."""
    path = _manifest_path()
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def save_manifest(doc_hashes: dict[str, str], doc_count: int) -> str:
    """
    Save manifest with doc_hashes and index_version (content-derived).
    Returns the index_version string.
    """
    content_hash = hashlib.sha256(json.dumps(doc_hashes, sort_keys=True).encode()).hexdigest()[:16]
    manifest = {
        "doc_hashes": doc_hashes,
        "doc_count": doc_count,
        "index_version": content_hash,
    }
    path = _manifest_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return content_hash


def needs_rebuild(docs_dir: Path) -> bool:
    """
    Return True if docs have changed since last index (or no manifest exists).
    Compares current doc hashes to manifest.
    """
    current = _current_doc_hashes(docs_dir)
    if not current:
        return False  # No docs to index
    manifest = load_manifest()
    if manifest is None:
        return True  # First run or manifest missing
    stored = manifest.get("doc_hashes") or {}
    if set(current.keys()) != set(stored.keys()):
        return True
    for name, h in current.items():
        if stored.get(name) != h:
            return True
    return False


def rebuild(store: Any, docs_dir: Path, load_docs_fn: Any) -> tuple[int, list[Any]]:
    """
    Clear the store's collection and re-index from docs_dir using load_docs_fn().
    load_docs_fn must be a callable that takes (docs_dir: Path) and returns list[Document].
    Saves manifest after indexing. Returns (number of documents added, documents list).
    """
    try:
        ids = store._collection.get(include=[])["ids"]
        if ids:
            store._collection.delete(ids=ids)
    except Exception as e:
        logger.warning("index_manager: could not clear collection: %s", e)
    documents = load_docs_fn(docs_dir)
    if not documents:
        return 0, []
    store.add_documents(documents)
    doc_hashes = _current_doc_hashes(docs_dir)
    version = save_manifest(doc_hashes, len(documents))
    logger.info("index_manager: rebuilt index with %d chunks, version=%s", len(documents), version)
    return len(documents), documents

"""Tests for index_manager: manifest, needs_rebuild, rebuild."""

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from app.index_manager import (
    load_manifest,
    needs_rebuild,
    rebuild,
    save_manifest,
)


@pytest.fixture
def temp_manifest_dir(tmp_path, monkeypatch):
    """Point chroma_persist_dir to tmp_path."""
    monkeypatch.setattr("app.index_manager.get_settings", lambda: MagicMock(chroma_persist_dir=str(tmp_path)))
    return tmp_path


def test_save_and_load_manifest(temp_manifest_dir):
    """save_manifest writes JSON; load_manifest reads it."""
    hashes = {"a.md": "abc", "b.md": "def"}
    version = save_manifest(hashes, doc_count=10)
    assert isinstance(version, str)
    manifest = load_manifest()
    assert manifest is not None
    assert manifest["doc_hashes"] == hashes
    assert manifest["doc_count"] == 10
    assert manifest["index_version"] == version


def test_load_manifest_missing_returns_none(monkeypatch):
    """When manifest file does not exist, load_manifest returns None."""
    monkeypatch.setattr("app.index_manager._manifest_path", lambda: Path("/nonexistent/manifest.json"))
    assert load_manifest() is None


def test_needs_rebuild_no_manifest(tmp_path, monkeypatch):
    """needs_rebuild returns True when no manifest exists and docs exist."""
    doc_dir = tmp_path / "docs"
    doc_dir.mkdir()
    (doc_dir / "x.md").write_text("# Hi")
    monkeypatch.setattr("app.index_manager.get_settings", lambda: MagicMock(chroma_persist_dir=str(tmp_path)))
    assert needs_rebuild(doc_dir) is True


def test_needs_rebuild_unchanged_returns_false(tmp_path, monkeypatch):
    """When hashes match manifest, needs_rebuild returns False."""
    doc_dir = tmp_path / "docs"
    doc_dir.mkdir()
    (doc_dir / "x.md").write_text("# Hi")
    monkeypatch.setattr("app.index_manager.get_settings", lambda: MagicMock(chroma_persist_dir=str(tmp_path)))
    hashes = {"x.md": "fakehash"}
    save_manifest(hashes, 1)
    # Stored hashes won't match current (we used fakehash). So we need to compute real hash and save.
    from app.index_manager import _current_doc_hashes
    real = _current_doc_hashes(doc_dir)
    save_manifest(real, 1)
    assert needs_rebuild(doc_dir) is False


def test_rebuild_clears_and_adds(monkeypatch, tmp_path):
    """rebuild clears store and calls load_docs_fn, then save_manifest."""
    doc_dir = tmp_path / "docs"
    doc_dir.mkdir()
    (doc_dir / "y.md").write_text("# Doc")
    monkeypatch.setattr("app.index_manager.get_settings", lambda: MagicMock(chroma_persist_dir=str(tmp_path)))
    store = MagicMock()
    deleted = []
    store._collection.get.return_value = {"ids": ["id1", "id2"]}
    store._collection.delete.side_effect = lambda *, ids: deleted.extend(ids)
    from langchain_core.documents import Document
    def load_docs(d):
        return [Document(page_content="chunk", metadata={"source": "y.md"})]
    n, docs_returned = rebuild(store, doc_dir, load_docs)
    assert n == 1
    assert len(docs_returned) == 1
    store.add_documents.assert_called_once()
    assert len(deleted) == 2
    manifest = load_manifest()
    assert manifest is not None
    assert "y.md" in manifest["doc_hashes"]

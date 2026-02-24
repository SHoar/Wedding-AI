# Wedding AI Service (PydanticAI + LangChain)

FastAPI microservice that powers the `/api/weddings/:id/ask` endpoint in Rails. It uses in-request wedding context (guests, tasks, guestbook) plus a **RAG knowledge base** built from Markdown docs to answer questions.

## Stack

- FastAPI
- PydanticAI agent
- LangChain prompt + summarization chain
- OpenAI for chat and embeddings
- Chroma for vector store (RAG)

## Environment

```bash
cp .env.example .env
```

Required:

- `OPENAI_API_KEY`

Optional:

- `OPENAI_MODEL` (default: `gpt-5-nano`)
- `AI_HTTP_TIMEOUT` (default: `45`)
- `DOCS_DIR` (default: `./docs`) — directory of Markdown docs to index for RAG
- `RAG_TOP_K` (default: `5`) — number of doc chunks to retrieve per question
- `CHROMA_PERSIST_DIR` (default: `./data/chroma`) — where to persist the Chroma index
- `OPENAI_EMBEDDING_MODEL` (default: `text-embedding-3-small`)
- `CACHE_TTL_SECONDS` (default: `0`) — when > 0, cache responses for this many seconds to avoid duplicate LLM calls

## RAG knowledge base

- **Source**: Markdown files in `docs/` (project root). Each page of the Wedding AI app has a tutorial (e.g. `guests.md`, `tasks.md`). The service chunks docs by `##` sections and embeds them with OpenAI.
- **When indexing runs**: On the first `/ask` (or `/ask_docs`) request, if the Chroma collection is empty, the service scans `DOCS_DIR` for `*.md` and builds the index. Subsequent requests use the existing store. With Docker, `docs/` is mounted at `/app/docs` and `DOCS_DIR` is set to `/app/docs`.
- **Persistence**: Chroma is stored in `CHROMA_PERSIST_DIR`. In Docker, a volume is used so the index survives restarts.
- **Performance**: Lowering `RAG_TOP_K` (e.g. to 3) can reduce prompt size and latency. Set `CACHE_TTL_SECONDS` (e.g. 30–60) to cache identical questions and avoid duplicate LLM calls.

## Local run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Ensure `docs/` exists at repo root (or set `DOCS_DIR` to your Markdown folder). The first time you call `/ask` or `/ask_docs`, the RAG index will be built if the store is empty.

## Tests and lint

From the `ai_service` directory:

```bash
pip install -r requirements-dev.txt
pytest tests -v
ruff check . && ruff format .
```

From the repo root, you can run the same checks via [pre-commit](https://pre-commit.com/):

```bash
pip install pre-commit
pre-commit install
# Hooks run on git commit; or run manually:
pre-commit run --all-files
```

Pre-commit runs Ruff (lint + format) and pytest for `ai_service` when any file under `ai_service/` changes.

## API

### Health

```bash
curl -s http://localhost:8000/health
```

### Ask (full context + RAG)

Send the question plus wedding, guests, tasks, and guestbook. The answer uses both that context and relevant doc chunks.

```bash
curl -s -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I add a new guest?",
    "wedding": {"id": 1, "name": "My Wedding", "date": null, "venue_name": null},
    "guests": [],
    "tasks": [],
    "guestbook_entries": []
  }'
```

### Ask docs only (RAG only)

Answer from documentation only; no wedding/guests/tasks/guestbook context. Useful for how-to questions.

```bash
curl -s -X POST http://localhost:8000/ask_docs \
  -H "Content-Type: application/json" \
  -d '{"question": "What does the dashboard show?"}'
```

Example questions that benefit from RAG:

- “How do I add a guest?” → surfaces `docs/guests.md`
- “What does the dashboard show?” → surfaces `docs/dashboard.md`
- “Where do I manage tasks?” → surfaces `docs/tasks.md`
- “What context does the AI use?” → surfaces `docs/ai-qa.md`

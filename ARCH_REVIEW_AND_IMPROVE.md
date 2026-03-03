# Architecture Review: AI Service & Backend Integration
## 1. Current Architecture Overview
### High-Level Flow
Frontend (React) → Backend (Rails) → AI Service (FastAPI) → OpenAI + Chroma
* Request path for /api/weddings/:wedding_id/ask:
* Frontend → POST /api/weddings/:id/ask with { question }
* Backend (AskController) loads wedding with guests, tasks, guestbook entries
* AskContextBuilder builds a context hash (wedding, guests, tasks, guestbook_entries)
* AiAgentClient sends POST /ask to the AI service with question + context
### AI Service:
Builds markdown from context
* Summarizes context (LangChain)
* Retrieves docs from Chroma (RAG)
* Generates answer (PydanticAI)
* Response flows back through Rails to the frontend
Service Topology (Docker Compose)
Service	Role
db (Postgres)	Wedding, guests, tasks, guestbook
redis	Caching (Rails + AI service)
ai-service (FastAPI)	RAG + Q&A, Chroma, OpenAI
backend (Rails)	API, context assembly, AI proxy
prometheus	Scrapes ai-service /metrics
wedding-dashboard-frontend	React UI
Backend depends on db, ai-service, and redis being healthy.

## 2. Backend ↔ AI Service Integration
Contract
Endpoint: POST /ask
Request: { question, wedding, guests, tasks, guestbook_entries }
Response: { answer, model?, context_summary? }
Backend (AskController + AiAgentClient)
Uses AI_SERVICE_URL (e.g. http://ai-service:8000)
90s timeout
Rails cache (60s TTL) keyed by wedding_id, question, and context digest
Error handling: AiAgentClient::RequestError → 502
AI Service (main.py)
Pydantic models for request/response

Two endpoints:
/ask: full context (wedding data) + RAG docs
/ask_docs: RAG docs only (not used by backend today)
### Integration Notes
Duplicate caching: Rails caches full responses; AI service also caches (Redis or in-memory). Both are keyed by question + context, so behavior is consistent but redundant.
/ask_docs unused: Backend only calls /ask. Pure “how-to” questions still send full wedding context.
Response shape: Backend only uses answer; model and context_summary are not exposed to the frontend.
Sync HTTP: Backend uses blocking HTTP; no streaming.

## 3. RAG Architecture (Current)
Pipeline
docs/*.md → chunk by ## sections → embed (OpenAI) → Chromaquestion → embed → similarity_search(k=5) → chunks → prompt → LLM
Components
Component	Implementation
Docs	docs/*.md (6 files: dashboard, guests, tasks, guestbook, ai-qa, README)
Chunking	Section-based: split on ##, max ~1200 chars per chunk
Embeddings	text-embedding-3-small
Vector store	Chroma, persisted in CHROMA_PERSIST_DIR
Retrieval	similarity_search(question, k=5)
Caching	RAG cache (question → chunks) with RAG_CACHE_TTL_SECONDS (e.g. 300s)
Indexing	On first request if collection is empty; no incremental updates
/ask Flow
build_context_markdown – wedding/guests/tasks/guestbook → markdown
summarize_context – LangChain summarization of that markdown
get_retrieved_context_cached – RAG retrieval (with optional cache)
generate_answer – PydanticAI agent with context summary + RAG chunks
Summarization and RAG run in parallel (asyncio.gather).

## 4. Strengths
Clear separation: Rails for data and orchestration, AI service for RAG and LLM
Observability: Prometheus metrics, Server-Timing headers, structured logs
Caching at multiple layers (Rails, AI response, RAG)
Health checks and dependency ordering in Docker
Tests for both backend and AI service
RAG store built at startup in the background

## 5. RAG Improvement Opportunities
### 5.1 Chunking Strategy
Current: Section-based (##), 1200-char cap.
Improvements:
Semantic chunking: Use LangChain RecursiveCharacterTextSplitter with overlap (e.g. 100–200 chars) to keep context across boundaries.
Metadata: Add source, heading, page for better filtering and attribution.
Chunk size: Tune for embedding model (e.g. 512 tokens for text-embedding-3-small).
Hierarchical chunks: Keep section-level chunks but also smaller sub-chunks for more precise retrieval.
### 5.2 Retrieval Strategy
Current: Single vector similarity search.
Improvements:
Hybrid search: Combine vector similarity with BM25 (or similar) for keyword matches.
Re-ranking: Use a cross-encoder or LLM to re-rank top-k (e.g. 20 → 5) for relevance.
Metadata filters: Filter by source or heading when the question implies a specific doc.
Query expansion: Rewrite the question into multiple queries and merge results.
Adaptive k: Adjust k by question type or estimated complexity.
### 5.3 Indexing & Freshness
Current: One-time indexing when collection is empty; no updates when docs change.
Improvements:
Doc change detection: Hash or timestamp docs; rebuild or update index when they change.
Incremental updates: Add/update/delete chunks instead of full rebuilds.
Background indexing: Separate worker or cron to refresh the index.
Versioning: Store index version and expose it for debugging.
### 5.4 Context Assembly & Prompting
Current: Fixed format: context_summary + retrieved_context.
Improvements:
Dynamic context: Vary how much wedding vs. docs context is used based on question type.
Structured prompts: Separate system/user/context sections and use few-shot examples.
Citation: Include source in the prompt so the model can cite docs.
Context length: Limit total context to avoid truncation and reduce cost.
### 5.5 Routing & Endpoint Usage
Current: All questions go through /ask with full wedding context.
Improvements:
Question routing: Classify questions (e.g. “how-to” vs. “data”) and route “how-to” to /ask_docs to avoid sending wedding data.
Backend routing: Add a backend path that calls /ask_docs for pure documentation questions.
### 5.6 Embedding & Model Choices
Current: text-embedding-3-small, gpt-5-nano.
Improvements:
Embedding model: Consider text-embedding-3-large or domain-specific models for better retrieval.
Model selection: Use a smaller model for summarization and a stronger one for final answer generation.
Cost vs. quality: Make model choice configurable per environment.
### 5.7 Operational & Reliability
Improvements:
Streaming: Stream tokens from the LLM for faster perceived response time.
Fallbacks: Fallback to cached or degraded answers when OpenAI is slow or failing.
Circuit breaker: Limit retries and fail fast when the AI service is down.
RAG observability: Log retrieval latency, cache hit rate, and chunk sources.

## 6. Summary
The system cleanly separates Rails (data, orchestration) from the AI service (RAG, summarization, Q&A). The RAG pipeline is straightforward and works for the current docs set. The main improvement areas are:
Retrieval quality: Hybrid search, re-ranking, and better chunking.
Index freshness: Detection of doc changes and incremental or background indexing.
Context efficiency: Routing “how-to” questions to /ask_docs and smarter context assembly.
User experience: Streaming responses and better attribution/citations.
If you want to focus on one area first, retrieval quality (chunking + re-ranking) and index freshness are the highest-impact changes for RAG behavior.
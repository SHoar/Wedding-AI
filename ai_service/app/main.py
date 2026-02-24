import asyncio
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from pydantic_ai import Agent

from app.retrieval import DOCS_DIR, get_or_build_store, get_retrieved_context

load_dotenv()

# RAG store: preloaded at startup when possible, else on first /ask
_rag_store = None


def _get_rag_store():
    global _rag_store
    if _rag_store is None:
        _rag_store = get_or_build_store(Path(DOCS_DIR))
    return _rag_store


async def _lifespan(app: FastAPI):
    """Start RAG store build in background so it is often ready before first /ask."""

    def build_store():
        global _rag_store
        try:
            _rag_store = get_or_build_store(Path(DOCS_DIR))
        except Exception:
            pass

    asyncio.create_task(asyncio.to_thread(build_store))
    yield

OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-nano")
AI_HTTP_TIMEOUT = float(os.getenv("AI_HTTP_TIMEOUT", "45"))


def _require_api_key() -> None:
    if not OPENAI_API_KEY:
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


class WeddingContext(BaseModel):
    id: int
    name: str
    date: str | None = None
    venue_name: str | None = None


class GuestContext(BaseModel):
    id: int | None = None
    name: str
    email: str | None = None
    phone: str | None = None
    plus_one_count: int = 0
    dietary_notes: str | None = None


class TaskContext(BaseModel):
    id: int | None = None
    title: str
    status: str | None = None
    priority: str | None = None


class GuestbookEntryContext(BaseModel):
    id: int | None = None
    guest_name: str
    message: str
    is_public: bool = True


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    wedding: WeddingContext
    guests: list[GuestContext] = Field(default_factory=list)
    tasks: list[TaskContext] = Field(default_factory=list)
    guestbook_entries: list[GuestbookEntryContext] = Field(default_factory=list)


class AskResponse(BaseModel):
    answer: str
    model: str
    context_summary: str | None = None


class AskDocsRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)


SYSTEM_PROMPT = """
You are an operations copilot for a wedding coordination dashboard.
Use the provided planning context to answer clearly and concretely.

Rules:
- If data is missing, say so explicitly.
- Prefer concise, practical answers.
- For schedule questions, mention exact times if provided.
- For guest or task summaries, provide actionable next steps.
""".strip()


langchain_model = ChatOpenAI(
    model=OPENAI_MODEL,
    temperature=0,
    timeout=AI_HTTP_TIMEOUT,
)

qa_agent = Agent(
    model=f"openai:{OPENAI_MODEL}",
    system_prompt=SYSTEM_PROMPT,
)


def _normalize_llm_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        normalized_parts: list[str] = []
        for part in content:
            if isinstance(part, dict) and "text" in part:
                normalized_parts.append(str(part["text"]))
            else:
                normalized_parts.append(str(part))
        return " ".join(normalized_parts).strip()
    return str(content)


def build_context_markdown(payload: AskRequest) -> str:
    wedding = payload.wedding
    lines = [
        f"Wedding: {wedding.name}",
        f"Date: {wedding.date or 'unknown'}",
        f"Venue: {wedding.venue_name or 'unknown'}",
        "",
        "Guests:",
    ]

    if payload.guests:
        for guest in payload.guests:
            lines.append(
                f"- {guest.name} | email={guest.email or '-'} | phone={guest.phone or '-'} | "
                f"plus_ones={guest.plus_one_count} | dietary={guest.dietary_notes or '-'}"
            )
    else:
        lines.append("- No guest records provided.")

    lines.append("")
    lines.append("Tasks:")
    if payload.tasks:
        for task in payload.tasks:
            lines.append(
                f"- {task.title} | status={task.status or 'pending'} | priority={task.priority or 'medium'}"
            )
    else:
        lines.append("- No tasks provided.")

    lines.append("")
    lines.append("Guestbook:")
    if payload.guestbook_entries:
        for entry in payload.guestbook_entries:
            visibility = "public" if entry.is_public else "private"
            lines.append(f"- {entry.guest_name} ({visibility}): {entry.message}")
    else:
        lines.append("- No guestbook entries provided.")

    return "\n".join(lines)


def summarize_context(context_markdown: str) -> str:
    summary_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You summarize wedding planning context for downstream Q&A. Keep facts, remove fluff.",
            ),
            (
                "human",
                "Summarize the context below in bullet points grouped by schedule, guests, and tasks.\n\n{context}",
            ),
        ]
    )

    chain = summary_prompt | langchain_model
    result = chain.invoke({"context": context_markdown})
    summary = _normalize_llm_content(getattr(result, "content", result))
    return summary.strip()


async def generate_answer(
    question: str, context_summary: str, retrieved_context: str = ""
) -> str:
    prompt = (
        "Question:\n"
        f"{question.strip()}\n\n"
        "Context summary:\n"
        f"{context_summary}"
    )
    if retrieved_context:
        prompt += "\n\n" + retrieved_context
    result = await qa_agent.run(prompt)

    output = getattr(result, "output", None)
    if output is None:
        output = getattr(result, "data", None)
    return _normalize_llm_content(output or result).strip()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": OPENAI_MODEL}


@app.post("/ask", response_model=AskResponse)
async def ask(payload: AskRequest) -> AskResponse:
    _require_api_key()
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be blank.")

    try:
        context_markdown = build_context_markdown(payload)
        context_summary = summarize_context(context_markdown)
        store = _get_rag_store()
        retrieved_context = get_retrieved_context(payload.question, store)
        answer = await generate_answer(question, context_summary, retrieved_context)
    except Exception as exc:  # pragma: no cover - upstream LLM/network exceptions
        raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc

    if not answer:
        raise HTTPException(status_code=502, detail="AI returned an empty answer.")

    return AskResponse(
        answer=answer,
        model=OPENAI_MODEL,
        context_summary=context_summary or None,
    )


@app.post("/ask_docs", response_model=AskResponse)
async def ask_docs(payload: AskDocsRequest) -> AskResponse:
    """Answer using only the RAG documentation (no wedding/guests/tasks/guestbook context)."""
    _require_api_key()
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be blank.")

    try:
        store = _get_rag_store()
        retrieved_context = get_retrieved_context(question, store)
        context_summary = (
            "No live wedding data provided; answer from documentation only."
        )
        answer = await generate_answer(question, context_summary, retrieved_context)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc

    if not answer:
        raise HTTPException(status_code=502, detail="AI returned an empty answer.")

    return AskResponse(
        answer=answer,
        model=OPENAI_MODEL,
        context_summary=context_summary,
    )

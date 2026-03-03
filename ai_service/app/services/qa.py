"""Q&A answer generation using PydanticAI agent."""

from pydantic_ai import Agent
from pydantic_ai.messages import PartDeltaEvent, TextPartDelta

from app.services.summarization import normalize_llm_content

SYSTEM_PROMPT = """
You are an operations copilot for a wedding coordination dashboard.
Use the provided planning context and relevant documentation to answer clearly and concretely.

Rules:
- If data is missing, say so explicitly.
- Prefer concise, practical answers.
- For schedule questions, mention exact times if provided.
- For guest or task summaries, provide actionable next steps.
- When you use information from the "Relevant documentation" section, cite the source (e.g. "According to guests.md..." or "As noted in the docs...").
""".strip()

PROMPT_TEMPLATE = """## Question
{question}

## Wedding Context
{context_summary}

## Relevant Documentation
{retrieved_context}

## Instructions
Answer the question using the wedding context and documentation above. Cite sources when using documentation."""


def create_qa_agent(model: str = "gpt-5-nano") -> Agent:
    """Create a PydanticAI agent for Q&A. Model can be overridden for tests."""
    return Agent(
        model=f"openai:{model}",
        system_prompt=SYSTEM_PROMPT,
    )


# Default agent instance (used by route handlers; tests can patch or inject)
_default_agent: Agent | None = None


def get_qa_agent(model: str = "gpt-5-nano") -> Agent:
    """Return the default Q&A agent, creating it if needed."""
    global _default_agent
    if _default_agent is None:
        _default_agent = create_qa_agent(model=model)
    return _default_agent


def _build_prompt(question: str, context_summary: str, retrieved_context: str) -> str:
    """Build structured prompt with sections. Use placeholder when no docs."""
    doc_section = retrieved_context.strip() if retrieved_context else "No additional documentation provided."
    return PROMPT_TEMPLATE.format(
        question=question.strip(),
        context_summary=context_summary.strip(),
        retrieved_context=doc_section,
    )


async def generate_answer(
    question: str,
    context_summary: str,
    retrieved_context: str = "",
    *,
    agent: Agent | None = None,
    model: str | None = None,
) -> str:
    """
    Generate an answer using the Q&A agent.
    If agent is None, uses get_qa_agent(model) with the given model or default.
    """
    prompt = _build_prompt(question, context_summary, retrieved_context)

    qa = agent if agent is not None else get_qa_agent(model=model or "gpt-5-nano")
    result = await qa.run(prompt)

    output = getattr(result, "output", None)
    if output is None:
        output = getattr(result, "data", None)
    return normalize_llm_content(output or result).strip()


async def stream_answer(
    question: str,
    context_summary: str,
    retrieved_context: str = "",
    *,
    agent: Agent | None = None,
    model: str | None = None,
):
    """
    Async generator that yields text deltas from the Q&A agent.
    Yields dicts {"type": "delta", "content": "..."} for SSE.
    """
    prompt = _build_prompt(question, context_summary, retrieved_context)
    qa = agent if agent is not None else get_qa_agent(model=model or "gpt-5-nano")
    async for event in qa.run_stream_events(prompt):
        if isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
            if event.delta.content_delta:
                yield {"type": "delta", "content": event.delta.content_delta}

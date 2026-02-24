"""Q&A answer generation using PydanticAI agent."""

from pydantic_ai import Agent

from app.services.summarization import normalize_llm_content

SYSTEM_PROMPT = """
You are an operations copilot for a wedding coordination dashboard.
Use the provided planning context to answer clearly and concretely.

Rules:
- If data is missing, say so explicitly.
- Prefer concise, practical answers.
- For schedule questions, mention exact times if provided.
- For guest or task summaries, provide actionable next steps.
""".strip()


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
    prompt = f"Question:\n{question.strip()}\n\nContext summary:\n{context_summary}"
    if retrieved_context:
        prompt += "\n\n" + retrieved_context

    qa = agent if agent is not None else get_qa_agent(model=model or "gpt-5-nano")
    result = await qa.run(prompt)

    output = getattr(result, "output", None)
    if output is None:
        output = getattr(result, "data", None)
    return normalize_llm_content(output or result).strip()

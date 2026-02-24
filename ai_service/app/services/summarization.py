"""Context summarization for downstream Q&A using LangChain."""

from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

SYSTEM_PROMPT_SUMMARY = (
    "You summarize wedding planning context for downstream Q&A. Keep facts, remove fluff."
)
HUMAN_TEMPLATE = "Summarize the context below in bullet points grouped by schedule, guests, and tasks.\n\n{context}"


def normalize_llm_content(content: Any) -> str:
    """Normalize LangChain/LLM response content to a single string."""
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


def summarize_context(
    context_markdown: str,
    model: str = "gpt-5-nano",
    timeout: float = 45.0,
) -> str:
    """
    Summarize wedding context markdown into bullet points for the Q&A agent.
    Uses LangChain ChatOpenAI; model and timeout can be overridden for tests.
    """
    summary_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT_SUMMARY),
            ("human", HUMAN_TEMPLATE),
        ]
    )
    llm = ChatOpenAI(model=model, temperature=0, timeout=timeout)
    chain = summary_prompt | llm
    result = chain.invoke({"context": context_markdown})
    summary = normalize_llm_content(getattr(result, "content", result))
    return summary.strip()

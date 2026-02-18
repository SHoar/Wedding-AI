import { SparklesIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useApi } from "../hooks/useApi";

const DEFAULT_WEDDING_ID = Number(import.meta.env.VITE_DEFAULT_WEDDING_ID || 1);

const PROMPT_SUGGESTIONS = [
  "What time should guests arrive for the ceremony?",
  "Summarize dietary restrictions for catering.",
  "Which tasks are still open for this week?",
];

export function AIQnAPage({ weddingId = DEFAULT_WEDDING_ID }) {
  const { askWeddingAI } = useApi();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await askWeddingAI(weddingId, question.trim());
      setAnswer(response);
    } catch (askError) {
      setError(askError.message || "Unable to get an answer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Ask Wedding AI</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Ask about schedule details, venue logistics, or guest planning data.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Your question
            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about venue, schedule, and planning details..."
              value={question}
            />
          </label>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !question.trim()}
            type="submit"
          >
            {isLoading ? "Thinking..." : "Ask AI"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {answer ? (
          <article className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Answer</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-indigo-950">
              {answer}
            </p>
          </article>
        ) : null}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Prompt ideas</h2>
        <p className="mt-1 text-sm text-slate-600">
          Start with one of these common wedding operations prompts.
        </p>
        <ul className="mt-4 space-y-2">
          {PROMPT_SUGGESTIONS.map((prompt) => (
            <li key={prompt}>
              <button
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-100"
                onClick={() => setQuestion(prompt)}
                type="button"
              >
                {prompt}
              </button>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

import { SparklesIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveWeddingId } from "../hooks/useActiveWeddingId";
import { useApi } from "../hooks/useApi";

const PROMPT_SUGGESTIONS = [
  "What time should guests arrive for the ceremony?",
  "Summarize dietary restrictions for catering.",
  "Which tasks are still open for this week?",
];

const MAX_QUESTION_LENGTH = 4000;

export function AIQnAPage({ weddingId }) {
  const { askWeddingAI, askWeddingAIStream } = useApi();
  const {
    weddingId: resolvedWeddingId,
    isLoading: isResolvingWedding,
    error: weddingResolveError,
  } = useActiveWeddingId(weddingId);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [askError, setAskError] = useState(null);
  const [dots, setDots] = useState(0);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => setDots((d) => (d + 1) % 3), 400);
    return () => clearInterval(id);
  }, [isLoading]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const q = question.trim();
      if (!q || !resolvedWeddingId) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setAskError(null);
      setAnswer("");
      setIsLoading(true);
      try {
        const full = await askWeddingAIStream(
          resolvedWeddingId,
          q,
          (chunk) => setAnswer((prev) => prev + chunk),
          { signal: controller.signal }
        );
        setAnswer((prev) => (prev ? prev : full));
      } catch (err) {
        if (err.name === "AbortError") return;
        setAskError(err);
        try {
          const fallback = await askWeddingAI(resolvedWeddingId, q);
          setAnswer(fallback);
          setAskError(null);
        } catch (fallbackErr) {
          setAskError(fallbackErr);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [question, resolvedWeddingId, askWeddingAIStream, askWeddingAI]
  );

  const errorMessage =
    askError?.message || (askError && "Unable to get an answer.");

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Ask Wedding AI
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Ask about schedule details, venue logistics, or guest planning data.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Routing question to wedding id{" "}
          <span className="font-semibold">{resolvedWeddingId}</span>
          {isResolvingWedding ? " (resolving...)" : ""}.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Your question
            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about venue, schedule, and planning details..."
              value={question}
            />
          </label>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || isResolvingWedding || !question.trim()}
            type="submit"
          >
            {isLoading ? `Thinking${".".repeat(dots + 1)}` : "Ask AI"}
          </button>
        </form>

        {weddingResolveError ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {weddingResolveError}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {(answer || isLoading) ? (
          <article className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
              Answer
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-indigo-950">
              {answer || (isLoading ? `Thinking${".".repeat(dots + 1)}` : "")}
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

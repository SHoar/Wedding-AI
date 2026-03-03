import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { http } from "../api/client";
import { ROUTES } from "../constants/routes";

export function FAQDocPage() {
  const { slug } = useParams();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDoc = useCallback(async (docSlug) => {
    if (!docSlug) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await http.get(`/api/docs/${docSlug}`, {
        responseType: "text",
      });
      const text = typeof res.data === "string" ? res.data : "";
      setContent(text);
      const firstLine = text.split("\n")[0]?.replace(/^#\s*/, "").trim() || docSlug;
      setTitle(firstLine);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Document not found."
          : err.response?.data || err.message || "Unable to load document."
      );
      setContent("");
      setTitle("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoc(slug);
  }, [slug, loadDoc]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-slate-500">Loading…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700"
          to={ROUTES.FAQ}
        >
          <ArrowLeftIcon className="size-4" />
          Back to FAQ
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="size-5 text-indigo-600" />
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-rose-100 hover:text-rose-700"
            to={ROUTES.FAQ}
          >
            <ArrowLeftIcon className="size-4" />
            Back to FAQ
          </Link>
        </div>

        <div className="faq-doc-content space-y-4 text-slate-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="border-b border-slate-200 pb-2 text-xl font-semibold text-slate-900">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-6 text-lg font-semibold text-slate-900">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-4 text-base font-semibold text-slate-900">{children}</h3>
              ),
              p: ({ children }) => <p className="leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc space-y-1 pl-6">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal space-y-1 pl-6">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              a: ({ href, children }) => (
                <a
                  className="font-medium text-rose-600 underline hover:text-rose-700"
                  href={href}
                  rel="noopener noreferrer"
                  target={href?.startsWith("http") ? "_blank" : undefined}
                >
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-800">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-800">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-rose-200 pl-4 italic text-slate-600">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </article>
    </section>
  );
}

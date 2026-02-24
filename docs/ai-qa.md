# AI Q&A Page

The AI Q&A page lets you ask questions about your wedding. The AI uses your live data (wedding, guests, tasks, guestbook) plus documentation from this app to give concrete answers.

## What this page does

- **Ask Wedding AI**: A text area for your question and an “Ask AI” button. The answer appears below. Prompt suggestions are shown on the side (e.g. “What time should guests arrive?”, “Summarize dietary restrictions”, “Which tasks are still open?”).
- **Routing**: The question is sent for the **active wedding**. The page shows “Routing question to wedding id …” so you know which wedding’s data is used.

## What context is sent

When you ask a question, the backend loads the active wedding and then calls the AI service with:

- **Wedding**: id, name, date, venue name.
- **Guests**: list with name, email, phone, plus_one_count, dietary_notes.
- **Tasks**: list with title, status, priority.
- **Guestbook entries**: list with guest_name, message, is_public.

The AI service also retrieves relevant chunks from the **documentation** (the `docs/` Markdown files) using a RAG (retrieval-augmented generation) store. So answers can combine your live data with “how-to” info (e.g. how to add a guest, what the dashboard shows).

## How to ask good questions

- **Schedule**: “What time should guests arrive?” — AI can use timeline/venue context if provided.
- **Guests**: “Summarize dietary restrictions for catering.” — Uses guest dietary_notes.
- **Tasks**: “Which tasks are still open?” or “What’s left to do this week?” — Uses task list and status.
- **How-to**: “How do I add a guest?” or “Where do I manage tasks?” — RAG pulls from docs (guests.md, tasks.md, etc.).

## API flow

1. Frontend calls backend: `POST /api/weddings/:wedding_id/ask` with `{ question }`.
2. Backend loads wedding, guests, tasks, guestbook for that wedding and sends an `AskRequest` to the AI service: `POST /ask` with question and full context.
3. AI service builds a context summary, retrieves relevant doc chunks (RAG), and generates an answer with the LLM. Returns `AskResponse` with `answer`, `model`, and optional `context_summary`.
4. Backend returns the answer text to the frontend, which displays it.

## Optional: docs-only questions

If the AI service exposes a separate endpoint (e.g. `POST /ask_docs`) that answers using only the documentation (no wedding/guests/tasks/guestbook), you can use it for pure “how-to” questions without sending live data. Check the ai_service README for availability and usage.

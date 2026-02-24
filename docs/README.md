# Wedding AI App — Documentation

Wedding AI is a wedding coordination dashboard that helps you manage guests, tasks, guestbook entries, and get answers from an AI assistant.

## What this app does

- **Dashboard**: Overview of guest counts, task completion, dietary requests, and a day-of timeline.
- **Guests**: Add and view guest records with contact info and dietary notes.
- **Guestbook**: Collect and display celebratory messages from guests (public or private).
- **Tasks**: Create and track wedding tasks with priority and status.
- **AI Q&A**: Ask questions about your wedding data; the AI uses your wedding, guests, tasks, and guestbook context plus app documentation to answer.

## Stack

- **Frontend**: React (Vite), React Router, Tailwind CSS. Runs at port 8080 when using Docker.
- **Backend**: Ruby on Rails API. Endpoints under `/api` for weddings, guests, guestbook entries, tasks, and `POST /api/weddings/:wedding_id/ask` for AI.
- **AI service**: FastAPI (Python) with LangChain and PydanticAI. Provides `POST /ask`; uses OpenAI for chat and embeddings, and a RAG knowledge base built from this `docs/` folder.

## How to run

With Docker (recommended):

```bash
# From project root; ensure .env has OPENAI_API_KEY
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- AI service: http://localhost:8000

Local development: run backend (Rails), frontend (Vite), and ai_service (uvicorn) separately; see each component’s README.

## Page tutorials

- [Dashboard](dashboard.md) — Stats, timeline, guest status, recent guestbook.
- [Guests](guests.md) — Add a guest, guest list, API.
- [Guestbook](guestbook.md) — Sign guestbook, public/private entries, API.
- [Tasks](tasks.md) — Create task, list, status, priority, API.
- [AI Q&A](ai-qa.md) — How to ask, what context is sent, tips.

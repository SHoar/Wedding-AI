# Wedding AI Dashboard

Full-stack wedding coordination system with:

- **React SPA** frontend (`frontend/`)
- **Rails API** backend (`backend/`)
- **Python AI microservice** (`ai_service/`) using **LangChain + PydanticAI + OpenAI `gpt-5-nano`**
- **PostgreSQL** for application data

## Architecture

```text
React (Vite SPA) --> Rails API (/api/*) --> PostgreSQL
                                |
                                +--> Python AI service (/ask)
                                       |- LangChain context summarization
                                       |- PydanticAI agent orchestration
                                       \- OpenAI gpt-5-nano
```

## Repository layout

```text
.
├── frontend/            # React dashboard (Vite, Tailwind, Router)
├── backend/             # Rails API-only application
├── ai_service/          # FastAPI + LangChain + PydanticAI service
└── docker-compose.yml   # Local orchestration (db + backend + ai + frontend)
```

## API endpoints consumed by frontend

- `GET /api/weddings`
- `GET /api/guests`
- `POST /api/guests`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/weddings/:wedding_id/guestbook_entries`
- `GET /api/guestbook_entries` (fallback path)
- `POST /api/guestbook_entries`
- `POST /api/weddings/:wedding_id/ask`

## Docker quick start

1. Create env files:

   ```bash
   cp .env.example .env
   ```

2. Set `OPENAI_API_KEY` inside `.env`.

3. Build and run:

   ```bash
   docker compose up --build
   ```

4. Open:
   - Frontend: `http://localhost:8080`
   - Rails API: `http://localhost:3000`
   - AI service health: `http://localhost:8000/health`

## Frontend auth stub

`frontend/src/hooks/useApi.js` includes JWT + cookie support:

- Reads `localStorage.getItem("wedding_jwt")`
- Sends `Authorization: Bearer <token>` when present
- Uses `withCredentials: true` for cookie-based auth
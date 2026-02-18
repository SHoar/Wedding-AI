# Wedding AI Dashboard (Rails API + React SPA)

This repository now contains a production-style React SPA (`frontend/`) that wraps a Rails API for wedding coordination workflows:

- Guest management
- Guestbook messages
- Task tracking
- AI Q&A (`/api/weddings/:id/ask`) for your LangChain + PydanticAI + OpenAI `gpt-5-nano` backend

## Repository layout

```text
.
├── frontend/                  # Vite + React SPA
│   ├── src/
│   │   ├── layouts/MainLayout.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── GuestsPage.jsx
│   │   │   ├── GuestbookPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   └── AIQnAPage.jsx
│   │   ├── components/
│   │   └── hooks/useApi.js
│   ├── Dockerfile
│   └── .env.example
└── docker-compose.yml         # Frontend container service
```

## Quick start (local development)

1. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Configure API base URL:

   ```bash
   cp .env.example .env
   ```

   Defaults:
   - `VITE_API_BASE_URL=http://localhost:3000`
   - `VITE_DEFAULT_WEDDING_ID=1`

3. Start the frontend:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`.

## Expected Rails API endpoints

The SPA calls these endpoints:

- `GET /api/weddings`
- `GET /api/guests`
- `POST /api/guests`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/weddings/:wedding_id/guestbook_entries` (with fallback to `GET /api/guestbook_entries`)
- `POST /api/guestbook_entries`
- `POST /api/weddings/:wedding_id/ask`

## Auth wiring

`src/hooks/useApi.js` includes a JWT stub:

- It reads `localStorage.getItem("wedding_jwt")`
- If present, it sends `Authorization: Bearer <token>` on every request
- `withCredentials: true` is enabled for cookie-based sessions too

## Docker

Build and run the SPA in a container:

```bash
docker compose up --build
```

Then open `http://localhost:8080`.

You can override API values at build time:

```bash
VITE_API_BASE_URL=https://api.example.com VITE_DEFAULT_WEDDING_ID=42 docker compose up --build
```
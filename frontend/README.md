# Wedding Coordination Frontend

React SPA for the wedding dashboard, built with:

- Vite + React
- React Router
- Axios
- Tailwind CSS
- Headless UI + Heroicons

## Run with Docker

From the **project root**: `docker compose up --build`. The frontend is served at **http://localhost:8080** (nginx). For local Vite dev (hot reload), use "Start locally" below.

## Start locally

```bash
npm install
cp .env.example .env
npm run dev
```

Default app URL: `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Environment variables

```env
VITE_API_BASE_URL=/
VITE_API_PROXY_TARGET=http://localhost:3000
VITE_DEFAULT_WEDDING_ID=1
```

## API integration points

See `src/hooks/useApi.js` for all endpoint calls and request interceptors.

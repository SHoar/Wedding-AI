# Wedding AI Rails API

API-only Rails backend for the wedding coordination dashboard.

## Architecture

```mermaid
flowchart LR
  subgraph clients [Clients]
    Frontend[Frontend SPA]
  end
  subgraph rails [Rails API]
    Router[Router]
    ApiControllers[API Controllers]
    Models[Active Record Models]
    Services[Services]
  end
  DB[(PostgreSQL)]
  AIService[AI Service]
  Frontend -->|"HTTP /api/*"| Router
  Router --> ApiControllers
  ApiControllers --> Models
  ApiControllers --> Services
  Models --> DB
  Services -->|"POST /ask"| AIService
  ApiControllers -.->|"ask only"| Services
```

- **Router** → `config/routes.rb`: mounts `/api` namespace (weddings, guests, tasks, guestbook_entries, ask).
- **API Controllers** → CRUD + `AskController`; all inherit `Api::BaseController` (404, validation error handling).
- **Models** → Wedding, Guest, Task, GuestbookEntry; all DB access via Active Record (scopes, no raw SQL).
- **Services** → `AskContextBuilder` (builds context hash from a Wedding), `AiAgentClient` (HTTP to AI service).

## Request flow (typical CRUD)

```mermaid
sequenceDiagram
  participant Client
  participant Router
  participant Controller
  participant Model
  participant DB
  Client->>Router: GET /api/weddings
  Router->>Controller: WeddingsController#index
  Controller->>Model: Wedding.order(date: :asc)
  Model->>DB: SELECT
  DB-->>Model: rows
  Model-->>Controller: relation
  Controller->>Client: JSON array
```

## Ask flow (AI Q&A)

```mermaid
sequenceDiagram
  participant Client
  participant AskController
  participant Wedding
  participant AskContextBuilder
  participant AiAgentClient
  participant AIService
  participant DB
  Client->>AskController: POST /api/weddings/:id/ask
  AskController->>Wedding: includes(...).find(id)
  Wedding->>DB: wedding + guests + tasks + entries
  DB-->>Wedding: loaded
  AskController->>AskContextBuilder: build(wedding)
  AskContextBuilder->>Wedding: guests_for_ask, tasks_for_ask, etc.
  AskContextBuilder-->>AskController: context hash
  AskController->>AiAgentClient: ask(question:, **context)
  AiAgentClient->>AIService: POST /ask JSON
  AIService-->>AiAgentClient: answer
  AiAgentClient-->>AskController: answer string
  AskController->>Client: JSON answer
```

## Data model

```mermaid
erDiagram
  Wedding ||--o{ Guest : "has many"
  Wedding ||--o{ Task : "has many"
  Wedding ||--o{ GuestbookEntry : "has many"
  Wedding {
    int id PK
    string name
    date date
    string venue_name
    datetime created_at
    datetime updated_at
  }
  Guest {
    int id PK
    int wedding_id FK
    string name
    string email
    string phone
    int plus_one_count
    text dietary_notes
  }
  Task {
    int id PK
    int wedding_id FK
    string title
    int status
    int priority
  }
  GuestbookEntry {
    int id PK
    int wedding_id FK
    string guest_name
    text message
    boolean is_public
  }
```

## Endpoints

- `GET /api/weddings`
- `POST /api/weddings`
- `GET /api/guests`
- `POST /api/guests`
- `GET /api/guestbook_entries`
- `POST /api/guestbook_entries`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/weddings/:wedding_id/ask` (delegates to Python AI service)

## Environment

Copy and edit:

```bash
cp .env.example .env
```

Important variables:

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `FRONTEND_ORIGINS` (comma-separated list, e.g. `http://localhost:5173,http://localhost:8080`)
- `AI_SERVICE_URL` (e.g. `http://ai-service:8000` in compose)

## Local run (without Docker)

```bash
bundle install
bin/rails db:prepare
bin/rails db:seed
bin/rails server -p 3000
```

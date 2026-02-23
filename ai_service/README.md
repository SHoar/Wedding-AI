# Wedding AI Service (PydanticAI + LangChain)

FastAPI microservice that powers the `/api/weddings/:id/ask` endpoint in Rails.

## Stack

- FastAPI
- PydanticAI agent
- LangChain prompt + summarization chain
- OpenAI `gpt-5-nano`

## Environment

```bash
cp .env.example .env
```

Required:

- `OPENAI_API_KEY`

Optional:

- `OPENAI_MODEL` (default: `gpt-5-nano`)
- `AI_HTTP_TIMEOUT` (default: `45`)

## Local run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

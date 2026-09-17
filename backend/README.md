# Backend A — AI + Analysis + Decision Engine

Implements the Backend Lead endpoints from `api_contract.json`.

## Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Optional: copy `.env.example` to `.env` and set `GROQ_API_KEY`.

- `POST /chat/message` JSON body matches the API contract.
- Optional multipart field `audio` is transcribed with Groq `whisper-large-v3`, then classified with `llama-3.3-70b-versatile`.
- The exact Raju demo line (`Baadh ne meri fasal barbaad kar di`) always returns contract values (`emergency`, `0.91`) so the hackathon path is deterministic.
- Without a key, other messages use the prototype classifier. LLM/STT failures return `500 claude_api_failure` with `fallback_action: escalated`.

Demo clock is **2026-09-16**. Do not change it or October will incorrectly appear as current risk.

## Endpoints owned here

- `GET /borrower/{id}/score`
- `GET /borrower/{id}/cashflow-history`
- `GET /borrower/{id}/cashflow-analysis`
- `GET /borrower/{id}/risk-flags`
- `GET /borrower/{id}/assessment`
- `POST /chat/message`
- `GET /chat/history/{borrower_id}`

## Compile with Backend B

Keep a **single FastAPI app**. Backend B should:

1. Replace `InMemoryBorrowerRepository` / `InMemoryPaymentPlanGateway` with SQLite-backed classes that satisfy the protocols in `app/services/__init__.py`.
2. Implement routers in `app/routers/backend_b.py` and include them from `app/main.py`.
3. Not re-implement seasonality, NLP, hardship classification, or relief decisions.
4. Have `apply_auto_relief()` be the only schedule mutation the decision engine calls.

`app.services.engine.engine` is the shared singleton Frontend A and Backend B can import.

## Tests

```bash
cd backend
pytest
```

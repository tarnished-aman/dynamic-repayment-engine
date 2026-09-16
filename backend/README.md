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

Optional: copy `.env.example` to `.env` and set `GROQ_API_KEY`. Without a key, NLP uses the prototype classifier (the Raju flood message still returns confidence `0.91`).

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

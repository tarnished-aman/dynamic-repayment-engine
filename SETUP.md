# Dynamic Risk & Repayment Engine — Setup Guide

This guide walks through setting up both the backend (FastAPI + Python) and frontend (Next.js + React) for local development.

---

## Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Git**

---

## Backend Setup

### 1. Navigate to backend directory

```bash
cd backend
```

### 2. Create and activate virtual environment

```bash
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Windows CMD
.\.venv\Scripts\activate.bat

# Linux/Mac
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Groq API key
# Get your key from https://console.groq.com/keys
```

Your `.env` should look like:

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
GROQ_WHISPER_MODEL=whisper-large-v3
DEMO_DATE=2026-09-16
```

**Note:** The backend works without a Groq API key (uses heuristic fallback), but intent classification will be less accurate. For the demo flood message `"Baadh ne meri fasal barbaad kar di"`, the heuristic fallback works correctly.

### 5. Seed the database

```bash
python seed.py
```

This creates `app.db` (SQLite) with 50 borrowers, including the demo borrower BOR001 (Raju Kumar).

### 6. Run the backend

```bash
uvicorn app.main:app --reload
```

Backend will be available at **http://localhost:8000**

Visit http://localhost:8000/docs for the interactive API documentation.

---

## Frontend Setup

### 1. Navigate to frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment (optional)

```bash
# Copy the example file
cp .env.local.example .env.local
```

The default backend URL is `http://localhost:8000`. Only edit `.env.local` if your backend runs on a different host/port.

### 4. Run the frontend

```bash
npm run dev
```

Frontend will be available at **http://localhost:3000**

---

## Testing the Integration

### 1. Verify backend is running

Open http://localhost:8000/borrowers in your browser. You should see:

```json
{
  "count": 50,
  "borrowers": [
    {
      "borrower_id": "BOR001",
      "name": "Raju Kumar",
      "trust_score": 72,
      ...
    }
  ]
}
```

### 2. Open the dashboard

Visit http://localhost:3000

You should see:
- A borrower table with 50 borrowers
- BOR001 (Raju Kumar) auto-selected
- Trust score card (72, medium trust)
- Cash flow analysis (temporary hardship)
- Risk flags (upcoming lean season in Oct)
- Payment plan
- A chat panel on the left

### 3. Test the chat (auto-relief flow)

In the chat panel, send this message (Hindi):

```
Baadh ne meri fasal barbaad kar di
```

Expected response:
- **Action:** Auto relief applied
- **Reason:** flood destroyed crops
- The payment plan table updates immediately — October installment deferred to 0, January 2027 installment added

### 4. Check the API response

Open your browser's Network tab and inspect the `/chat/message` POST response:

```json
{
  "borrower_id": "BOR001",
  "intent": "emergency",
  "extracted_reason": "flood destroyed crops",
  "intent_confidence": 0.91,
  "action_taken": "auto_relief",
  "payment_plan_updated": true,
  "matched_flag": "lean_season",
  "seasonal_match_type": "upcoming",
  ...
}
```

### 5. Verify payment plan was updated

The payment plan table should now show:
- **Original:** Oct ₹2500, Nov ₹2500
- **Adjusted:** Oct ₹0 (deferred), Nov ₹2500, Jan 2027 ₹2500 (added)

---

## Architecture

### Backend (`/backend`)

**Entry point:** `app/main.py` (unified FastAPI application)

**Key modules:**
- `app/routers/backend_b.py` — Backend Support routes (borrower profile, payment plans via SQLite)
- `app/routers/analysis.py` — Backend Lead routes (trust score, cashflow, risk flags, assessment via in-memory engine)
- `app/routers/chat.py` — Chat endpoint with NLP intent classification
- `app/services/engine.py` — Core decision engine
- `app/services/nlp.py` — Groq integration for intent classification + Whisper transcription
- `database.py` + `services/payment_service.py` — SQLite persistence layer

**Persistence:**
- **SQLite (`app.db`):** Borrower profiles, payment schedules (owned by Backend Support)
- **In-memory:** Detailed borrower history, alternative signals, conversations (owned by Backend Lead engine)

Both layers stay in sync: when `auto_relief` is triggered, the engine updates both the in-memory plan and the SQLite `payment_schedules` table.

### Frontend (`/frontend`)

**Framework:** Next.js 15 + React 19 + TypeScript + Tailwind CSS

**Key files:**
- `src/app/page.tsx` — Main dashboard with borrower selection + chat
- `src/components/chat-panel.tsx` — Real-time chat UI with action feedback
- `src/services/api.ts` — API client for all backend endpoints
- `src/components/` — Reusable UI components (TrustScoreCard, CashFlowChart, PaymentPlanTable, etc.)

---

## Troubleshooting

### Backend won't start

**Error:** `ModuleNotFoundError: No module named 'sqlalchemy'`

**Fix:** Make sure you activated the virtual environment and ran `pip install -r requirements.txt`

### Frontend shows "Failed to load borrowers"

**Cause:** Backend isn't running or CORS is blocking requests

**Fix:**
1. Verify backend is running at http://localhost:8000
2. Check backend terminal for errors
3. Ensure `app/main.py` has `http://localhost:3000` in the CORS `allow_origins` list (it does by default)

### Chat returns 500 error

**Cause:** Groq API key missing or invalid, or Groq service is down

**Fix:**
1. Check `backend/.env` has `GROQ_API_KEY=gsk_...`
2. The backend falls back to heuristic classification if Groq fails, so the demo message should still work (lower confidence)
3. Check backend terminal for detailed error logs

### Payment plan doesn't update after chat message

**Cause:** SQLite database wasn't seeded or is corrupted

**Fix:**
1. Stop the backend
2. Delete `backend/app.db`
3. Run `python seed.py` again
4. Restart the backend

---

## API Contract

The full API contract is in `api_contract.json` at the project root.

Key endpoints:
- `GET /borrowers` — list borrowers with optional filtering
- `GET /borrower/{id}/score` — trust score
- `GET /borrower/{id}/cashflow-analysis` — hardship classification + seasonality
- `GET /borrower/{id}/risk-flags` — current + upcoming risk windows
- `GET /borrower/{id}/assessment` — recommended action
- `GET /borrower/{id}/payment-plan` — original + adjusted schedules
- `POST /chat/message` — send borrower message, get intent + decision + action
- `GET /chat/history/{borrower_id}` — conversation audit trail

---

## Demo Scenario

**Borrower:** BOR001 — Raju Kumar (farmer, ₹25,000 loan)
**Demo date:** 16 Sep 2026
**Trust score:** 72 (medium trust)
**Cash flow:** Temporary stress (income -18.2% vs 12-month avg, repayment consistency 94%)
**Seasonality:** Oct-Nov lean season detected from 3 years of history
**Current flag:** Normal (September is not a lean month)
**Upcoming flag:** Lean season (October is 2 weeks away)

**Message:** `"Baadh ne meri fasal barbaad kar di"` (Hindi: "Flood destroyed my crops")

**Expected outcome:**
1. Intent: emergency (confidence 0.91)
2. Extracted reason: flood destroyed crops
3. Seasonal match: upcoming (October lean season)
4. Hardship: temporary (cash flow shows seasonal stress, not persistent decline)
5. **Action:** auto_relief
6. October ₹2500 installment deferred to ₹0, replacement installment added 3 months later (Jan 2027)

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

All 8 tests should pass:
- Trust score calculation
- Cash flow analysis + risk flags for demo borrower
- Insufficient history error handling
- 404 for unknown borrower
- Auto-relief flow (in-memory + HTTP)
- No-emergency message (no action)

---

## Production Deployment Notes

**Not production-ready.** This is a hackathon prototype. Before deploying:

1. Replace SQLite with PostgreSQL
2. Add authentication + authorization
3. Add rate limiting on chat endpoint
4. Validate/sanitize all user inputs
5. Add request ID tracing for debugging
6. Replace in-memory engine with a persistent data store
7. Add monitoring + alerting
8. Review and harden CORS settings
9. Add HTTPS/TLS termination
10. Audit decision logic with domain experts before live lending decisions

---

## Support

For questions or issues, check:
1. Backend logs (`uvicorn` terminal output)
2. Frontend console (browser DevTools → Console)
3. API docs at http://localhost:8000/docs
4. `api_contract.json` for expected request/response shapes


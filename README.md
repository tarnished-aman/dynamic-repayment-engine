# Dynamic Risk & Repayment Engine

A prototype microfinance decision engine that uses borrower-specific cash-flow analysis and seasonal pattern detection to distinguish temporary hardship from persistent deterioration, enabling context-aware repayment relief decisions.

## Features

- **Trust Score:** Alternative-data signals (utility payments, supplier consistency, mobile top-ups)
- **Cash Flow Analysis:** Income/expense trends, repayment consistency, hardship classification
- **Seasonal Pattern Detection:** Borrower-specific lean months from historical income data (not category-based)
- **Risk Flags:** Current + upcoming risk windows with 3-month lookahead
- **NLP Intent Classification:** Groq LLM + Whisper for message understanding (Hindi + English)
- **Auto-Relief Decision Engine:** Temporary hardship → defer installment; persistent → escalate
- **Real-time Chat Interface:** Borrower message → intent → action → payment plan update
- **Dual Persistence:** SQLite (payment schedules) + in-memory (detailed analysis) stay in sync

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt

# Add your Groq API key (optional but recommended)
cp .env.example .env
# Edit .env and set GROQ_API_KEY=gsk_your_key_here

python seed.py
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### 3. Test the Demo

1. Open http://localhost:3000
2. BOR001 (Raju Kumar) is auto-selected
3. In the chat panel, send: `Baadh ne meri fasal barbaad kar di`
4. Watch auto-relief apply: October installment deferred to ₹0, January 2027 added

## Documentation

- **[SETUP.md](./SETUP.md)** — Comprehensive setup guide with troubleshooting
- **[api_contract.json](./api_contract.json)** — Full API specification
- **Backend:** FastAPI + Python + SQLAlchemy + Groq
- **Frontend:** Next.js 15 + React 19 + TypeScript + Tailwind CSS

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                     │
│  - Dashboard with borrower selection                    │
│  - Real-time chat with decision feedback                │
│  - All components contract-compliant                    │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────────────────┐
│  Backend (FastAPI)                                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Backend Lead (In-Memory Engine)                    │ │
│  │ - Trust score, cash flow, seasonality, risk flags  │ │
│  │ - NLP (Groq LLM + Whisper)                         │ │
│  │ - Decision engine (auto_relief / escalate / none) │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Backend Support (SQLite)                           │ │
│  │ - Borrower profiles                                │ │
│  │ - Payment schedules (original + adjusted)          │ │
│  │ - Loan officer overrides                           │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

Both layers stay synchronized — when the engine triggers `auto_relief`, it updates both the in-memory payment plan (for live API reads) and the SQLite database (for persistence).

## Demo Scenario

**Borrower:** Raju Kumar (BOR001)  
**Category:** Farmer, ₹25,000 loan  
**Demo Date:** 16 Sep 2026

**Current State:**
- Trust score: 72 (medium)
- Cash flow: Temporary stress (income -18.2%, repayment consistency 94%)
- Seasonality: Oct-Nov lean season (detected from 3 years of history)
- Current flag: Normal (September is not a lean month)
- Upcoming flag: Lean season (October starts in 2 weeks)

**User Action:**  
Sends message in Hindi: `"Baadh ne meri fasal barbaad kar di"` (Flood destroyed my crops)

**System Response:**
1. **NLP:** Intent = emergency (confidence 0.91), reason = "flood destroyed crops"
2. **Seasonal Match:** Upcoming (reported hardship aligns with October lean season)
3. **Hardship:** Temporary (seasonal stress + strong repayment history)
4. **Decision:** Auto-relief
5. **Action:** October ₹2500 installment → deferred to ₹0, January 2027 ₹2500 added

The payment plan updates instantly in the UI, and the conversation is logged for audit.

## API Endpoints

| Endpoint | Method | Owner | Description |
|----------|--------|-------|-------------|
| `/borrowers` | GET | Backend Support | List borrowers with filtering |
| `/borrower/{id}` | GET | Backend Support | Borrower profile |
| `/borrower/{id}/score` | GET | Backend Lead | Trust score |
| `/borrower/{id}/cashflow-analysis` | GET | Backend Lead | Hardship classification + seasonality |
| `/borrower/{id}/risk-flags` | GET | Backend Lead | Current + upcoming risk windows |
| `/borrower/{id}/assessment` | GET | Backend Lead | Recommended action |
| `/borrower/{id}/payment-plan` | GET | Backend Support | Original + adjusted schedules |
| `/borrower/{id}/payment-plan/override` | POST | Backend Support | Loan officer manual override |
| `/chat/message` | POST | Backend Lead | Send message → decision + action |
| `/chat/history/{borrower_id}` | GET | Backend Lead | Conversation audit trail |

## Tests

```bash
cd backend
pytest tests/ -v
```

All 8 tests validate:
- Trust score calculation
- Cash flow analysis + risk flag detection
- Insufficient history error handling
- 404 for unknown borrowers
- Auto-relief flow (both in-memory and HTTP paths)
- No-emergency message handling

## Environment Variables

### Backend (`.env`)

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
GROQ_WHISPER_MODEL=whisper-large-v3
DEMO_DATE=2026-09-16
INTENT_CONFIDENCE_THRESHOLD=0.85
REPAYMENT_CONSISTENCY_THRESHOLD=0.85
```

Get your Groq API key from [https://console.groq.com/keys](https://console.groq.com/keys)

The backend works without a Groq key (uses heuristic fallback), but intent classification will be less accurate. The demo message `"Baadh ne meri fasal barbaad kar di"` is hardcoded in the fallback, so it works correctly even without the key.

### Frontend (`.env.local`, optional)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Only needed if your backend runs on a different host/port.

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point (unified)
│   │   ├── routers/
│   │   │   ├── backend_b.py     # Backend Support routes (SQLite)
│   │   │   ├── analysis.py      # Backend Lead routes (engine)
│   │   │   └── chat.py          # Chat + NLP
│   │   ├── services/
│   │   │   ├── engine.py        # Decision engine
│   │   │   ├── nlp.py           # Groq integration
│   │   │   ├── cashflow.py      # Cash flow analysis
│   │   │   ├── seasonality.py   # Pattern detection
│   │   │   ├── trust_score.py   # Alternative-data score
│   │   │   └── decision.py      # Auto-relief logic
│   │   ├── data/                # In-memory repository + seed
│   │   └── schemas.py           # Pydantic models
│   ├── database.py              # SQLAlchemy models
│   ├── services/payment_service.py  # SQLite mutations
│   ├── seed.py                  # Database seeder
│   └── tests/                   # Pytest suite
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Main dashboard
│   │   │   └── layout.tsx       # Root layout
│   │   ├── components/
│   │   │   ├── chat-panel.tsx   # Real-time chat UI
│   │   │   ├── BorrowerTable.tsx
│   │   │   ├── TrustScoreCard.tsx
│   │   │   ├── CashFlowChart.tsx
│   │   │   ├── RiskCard.tsx
│   │   │   ├── AssessmentCard.tsx
│   │   │   └── PaymentPlanTable.tsx
│   │   ├── services/api.ts      # Backend API client
│   │   └── types/index.ts       # TypeScript types
│   └── tailwind.config.ts       # Dark theme tokens
├── api_contract.json            # Full API spec
├── SETUP.md                     # Comprehensive setup guide
└── README.md                    # This file
```

## Tech Stack

**Backend:**
- FastAPI 0.141.1
- Python 3.14.7
- Pydantic 2.13.5
- SQLAlchemy 2.0.41
- Groq SDK 1.7.0 (Llama 3.3 + Whisper)
- Pytest 9.1.1

**Frontend:**
- Next.js 15.5.3
- React 19.1.1
- TypeScript 5.9.2
- Tailwind CSS 3.4.17
- Recharts 2.15.4

## Notes

- **Not production-ready:** This is a hackathon prototype. See SETUP.md for deployment notes.
- **Decision logic:** Seasonal patterns are borrower-specific (detected from historical income data), not assumed from category. This allows the system to identify actual lean months rather than relying on generic "farmer = monsoon" heuristics.
- **Groq API:** The demo message works without a Groq key thanks to the heuristic fallback, but for general messages you need a real key.
- **SQLite:** Only used for borrower profiles and payment schedules. The engine's detailed history and analysis live in memory.

## License

Prototype code for hackathon demonstration. Not licensed for production use.

## Support

Questions? Check:
1. [SETUP.md](./SETUP.md) for detailed troubleshooting
2. Backend logs (uvicorn terminal output)
3. Frontend console (browser DevTools)
4. API docs at http://localhost:8000/docs
5. `api_contract.json` for request/response shapes

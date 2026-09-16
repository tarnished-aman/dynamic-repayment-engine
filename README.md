# Dynamic Risk & Repayment Engine

> **Hackathon Prototype — API Contract v3.0**  
> *Automated hardship classification, seasonal risk flag detection, and flexible payment plan modification for micro-finance borrowers.*

---

## 📌 Project Overview

Traditional lending models fail to distinguish between **temporary seasonal hardship** and **persistent financial deterioration**. This engine leverages alternative data, historical cash-flow analysis, and voice/text NLP to detect emergency situations early. When temporary hardship is detected alongside an upcoming seasonal risk window, the system automatically adjusts the borrower's repayment schedule (e.g., deferring installments) to prevent unnecessary default.

> **Note:** Automated actions in this prototype reflect decision engine outputs and should not be interpreted as final production lending decisions.

---

## 🎯 Primary Demo Scenario (Raju Kumar - `BOR001`)

* **Current Demo Date:** `2026-09-16`
* **Borrower Profile:** Raju Kumar (`BOR001`) | Category: `farmer` | Loan: ₹25,000
* **Risk Flags:** Current = `Normal` | Upcoming = `Lean Season` (Starting October)
* **Demo Flow:**
  1. Raju submits a voice/text message in Hindi: *"Baadh ne meri fasal barbaad kar di"* (*"Floods destroyed my crops"*).
  2. The AI NLP engine transcribes and extracts intent (`emergency`, confidence: `0.91`).
  3. The Cash-Flow Engine identifies temporary stress (-18.2% income drop, 94% repayment consistency).
  4. The Decision Engine matches the emergency with the upcoming October Lean Season flag.
  5. **Auto-Relief Action:** October payment (₹2,500) is set to `deferred` (₹0), and an extra installment is `added` in January 2027.

---

## 🛠️ Tech Stack & Architecture

* **Backend Framework:** FastAPI (Python 3.10+)
* **Database:** SQLite + SQLAlchemy / SQLModel
* **AI / NLP Engine:** Groq API (`whisper-large-v3` for speech-to-text, `llama-3.3-70b-versatile` for intent extraction)
* **Frontend Framework:** React / Next.js + Tailwind CSS
* **Data Visualization:** Recharts
* **Prototyping & Layout:** v0.dev + Cursor IDE

---

## 📂 Repository Structure

```text
dynamic-repayment-engine/
├── api_contract.json       # Single Source of Truth for API endpoints & logic
├── backend/
│   ├── app/                # FastAPI application
│   ├── services/           # Decision engine & payment logic
│   ├── database.db         # SQLite local database
│   └── seed.py             # Synthetic data seeder (50 borrowers)
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI cards, tables, charts
│   │   ├── services/       # API client (http://localhost:8000)
│   │   └── pages/          # Dashboard canvas & WhatsApp sidebar
└── README.md
"""
Backend Support routes — borrower profile + payment plans.

Data is read from / written to SQLite via database.py and payment_service.py,
which is the Backend Support team's persistence layer.

Analysis (trust score, cashflow, seasonality, risk flags) is still delegated
to the Backend Lead engine so results stay consistent across all endpoints.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.errors import api_error, borrower_not_found
from app.schemas import (
    BorrowerCategory,
    HardshipClassification,
    RiskFlag,
)
from app.services.cashflow import analyze_cashflow
from app.services.engine import engine
from app.services.risk_flags import build_risk_flags
from app.services.trust_score import calculate_trust_score

# SQLite layer — Backend Support's persistence
from database import SessionLocal, Borrower, PaymentSchedule
from services.payment_service import apply_auto_relief, override_schedule

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_db_borrower(borrower_id: str):
    """Return a SQLite Borrower row or raise 404."""
    db = SessionLocal()
    b = db.query(Borrower).filter(Borrower.borrower_id == borrower_id).first()
    db.close()
    if b is None:
        raise borrower_not_found()
    return b


def _fmt_schedule(rows) -> list[dict]:
    return [
        {"due_date": str(r.due_date), "amount": r.amount, "status": r.status}
        for r in rows
    ]


# ---------------------------------------------------------------------------
# GET /borrower/{id}
# ---------------------------------------------------------------------------

@router.get("/borrower/{borrower_id}")
def get_borrower(borrower_id: str):
    """Return the basic borrower profile from SQLite (Backend Support data)."""
    b = _get_db_borrower(borrower_id)
    return {
        "borrower_id": b.borrower_id,
        "name": b.name,
        "category": b.category,
        "language_pref": b.language_pref,
        "loan_amount": b.loan_amount,
        "loan_start_date": b.loan_start_date,
        "phone_number": b.phone_number,
    }


# ---------------------------------------------------------------------------
# GET /borrowers
# ---------------------------------------------------------------------------

@router.get("/borrowers")
def list_borrowers(
    category: Optional[BorrowerCategory] = Query(default=None),
    risk_flag: Optional[RiskFlag] = Query(default=None),
    hardship_classification: Optional[HardshipClassification] = Query(default=None),
):
    """
    Return borrower summaries for the dashboard table.

    Static fields (name, stored flags) come from SQLite.
    Live trust score is computed by the Backend Lead engine for accuracy.
    Filtering is applied after computing each borrower so all three query
    params work correctly together.
    """
    db = SessionLocal()
    query = db.query(Borrower)
    if category:
        query = query.filter(Borrower.category == category)
    rows = query.all()
    db.close()

    results = []
    for b in rows:
        # Compute live trust score from the in-memory engine's borrower data
        # (alternative signals are stored there; SQLite stores the summary).
        mem_borrower = engine.repo.get_borrower(b.borrower_id)
        if mem_borrower is not None:
            score_resp = calculate_trust_score(mem_borrower, engine.settings)
            trust_score = score_resp.trust_score
        else:
            trust_score = b.trust_score  # fall back to seeded value

        current_flag = b.current_flag
        upcoming_flag = b.upcoming_flag
        upcoming_flag_month = b.upcoming_flag_month
        hc = b.hardship_classification

        # If this borrower is also in the in-memory engine, recompute live flags
        # so they reflect the demo clock correctly.
        if mem_borrower is not None:
            try:
                today = engine.clock.today()
                analysis = analyze_cashflow(mem_borrower, today, engine.settings)
                if len(mem_borrower.monthly_history) >= engine.settings.seasonality_minimum_history_months:
                    flags = build_risk_flags(mem_borrower, analysis, today, engine.settings)
                    current_flag = flags.current_flag
                    upcoming_flag = flags.upcoming_flag
                    upcoming_flag_month = flags.upcoming_flag_month
                hc = analysis.hardship_classification
            except Exception:
                pass  # keep seeded values if analysis fails

        # Apply post-compute filters
        if risk_flag is not None and current_flag != risk_flag:
            continue
        if hardship_classification is not None and hc != hardship_classification:
            continue

        results.append(
            {
                "borrower_id": b.borrower_id,
                "name": b.name,
                "trust_score": trust_score,
                "current_flag": current_flag,
                "upcoming_flag": upcoming_flag,
                "upcoming_flag_month": upcoming_flag_month,
                "hardship_classification": hc,
            }
        )

    return {"count": len(results), "borrowers": results}


# ---------------------------------------------------------------------------
# GET /borrower/{id}/payment-plan
# ---------------------------------------------------------------------------

@router.get("/borrower/{borrower_id}/payment-plan")
def get_payment_plan(borrower_id: str):
    """Return the original and adjusted repayment schedule from SQLite."""
    _get_db_borrower(borrower_id)  # 404 if not found

    db = SessionLocal()
    original = (
        db.query(PaymentSchedule)
        .filter(
            PaymentSchedule.borrower_id == borrower_id,
            PaymentSchedule.schedule_type == "original",
        )
        .order_by(PaymentSchedule.due_date)
        .all()
    )
    adjusted = (
        db.query(PaymentSchedule)
        .filter(
            PaymentSchedule.borrower_id == borrower_id,
            PaymentSchedule.schedule_type == "adjusted",
        )
        .order_by(PaymentSchedule.due_date)
        .all()
    )
    db.close()

    has_adjustment = bool(adjusted)
    return {
        "borrower_id": borrower_id,
        "original_schedule": _fmt_schedule(original),
        "adjusted_schedule": _fmt_schedule(adjusted) if has_adjustment else _fmt_schedule(original),
        "reason_for_adjustment": (
            "Temporary hardship confirmed through cash-flow analysis and emergency event assessment."
            if has_adjustment
            else None
        ),
        "updated_by": "decision_engine" if has_adjustment else None,
        "updated_at": "2026-09-16T12:00:00Z" if has_adjustment else None,
    }


# ---------------------------------------------------------------------------
# POST /borrower/{id}/payment-plan/override
# ---------------------------------------------------------------------------

class OverrideItem(BaseModel):
    due_date: str
    amount: float
    status: str


class OverrideRequest(BaseModel):
    new_schedule: list[OverrideItem]
    officer_note: Optional[str] = None


@router.post("/borrower/{borrower_id}/payment-plan/override")
def override_payment_plan(borrower_id: str, body: OverrideRequest):
    """
    Allow a loan officer to manually override the adjusted payment schedule
    for an escalated case. Persists to SQLite.
    """
    _get_db_borrower(borrower_id)  # 404 if not found

    if not body.new_schedule:
        raise api_error(
            400,
            "invalid_payment_schedule",
            "The supplied payment schedule is invalid.",
        )

    for item in body.new_schedule:
        if item.amount < 0:
            raise api_error(
                400,
                "invalid_payment_schedule",
                "The supplied payment schedule is invalid.",
            )

    override_schedule(
        borrower_id,
        [{"due_date": item.due_date, "amount": item.amount, "status": item.status} for item in body.new_schedule],
    )

    now = engine.clock.now()
    return {
        "status": "updated",
        "updated_at": now.isoformat() + "Z" if not str(now).endswith("Z") else str(now),
        "updated_by": "loan_officer",
    }

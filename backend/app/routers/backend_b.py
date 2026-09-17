"""
Backend B routers (borrower profile + payment plans).

Reuses engine.repo and engine.payments from the Backend A facade.
Does NOT implement seasonality, NLP, hardship classification, or relief decisions.
"""

from copy import deepcopy
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.errors import api_error, borrower_not_found
from app.schemas import (
    BorrowerCategory,
    HardshipClassification,
    PaymentPlan,
    PaymentScheduleItem,
    RiskFlag,
)
from app.services.cashflow import analyze_cashflow
from app.services.engine import engine
from app.services.risk_flags import build_risk_flags
from app.services.trust_score import calculate_trust_score

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /borrower/{id}
# ---------------------------------------------------------------------------

@router.get("/borrower/{borrower_id}")
def get_borrower(borrower_id: str):
    """Return the basic borrower profile."""
    borrower = engine.repo.get_borrower(borrower_id)
    if borrower is None:
        raise borrower_not_found()
    return {
        "borrower_id": borrower.borrower_id,
        "name": borrower.name,
        "category": borrower.category,
        "language_pref": borrower.language_pref,
        "loan_amount": borrower.loan_amount,
        "loan_start_date": borrower.loan_start_date,
        "phone_number": borrower.phone_number,
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

    Supports optional filtering by category, risk_flag, and hardship_classification.
    Trust score, flags and hardship are computed on the fly from the engine.
    """
    results = []
    for bid in engine.repo.list_borrower_ids():
        borrower = engine.repo.get_borrower(bid)
        if borrower is None:
            continue

        # Category filter — cheap, check early
        if category is not None and borrower.category != category:
            continue

        score_resp = calculate_trust_score(borrower, engine.settings)
        today = engine.clock.today()
        analysis = analyze_cashflow(borrower, today, engine.settings)

        has_enough_history = (
            len(borrower.monthly_history) >= engine.settings.seasonality_minimum_history_months
        )
        if has_enough_history:
            flags = build_risk_flags(borrower, analysis, today, engine.settings)
            current_flag = flags.current_flag
            upcoming_flag = flags.upcoming_flag
            upcoming_flag_month = flags.upcoming_flag_month
        else:
            current_flag = "normal"
            upcoming_flag = None
            upcoming_flag_month = None

        hc = analysis.hardship_classification

        # Apply remaining filters
        if risk_flag is not None and current_flag != risk_flag:
            continue
        if hardship_classification is not None and hc != hardship_classification:
            continue

        results.append(
            {
                "borrower_id": borrower.borrower_id,
                "name": borrower.name,
                "trust_score": score_resp.trust_score,
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
    """Return the original and currently adjusted repayment schedule."""
    borrower = engine.repo.get_borrower(borrower_id)
    if borrower is None:
        raise borrower_not_found()
    plan = engine.payments.get_plan(borrower_id)
    return plan


# ---------------------------------------------------------------------------
# POST /borrower/{id}/payment-plan/override
# ---------------------------------------------------------------------------

class OverrideRequest(BaseModel):
    new_schedule: list[PaymentScheduleItem]
    officer_note: Optional[str] = None


@router.post("/borrower/{borrower_id}/payment-plan/override")
def override_payment_plan(borrower_id: str, body: OverrideRequest):
    """
    Allow a loan officer to manually override the adjusted payment schedule
    for an escalated case.
    """
    borrower = engine.repo.get_borrower(borrower_id)
    if borrower is None:
        raise borrower_not_found()

    if not body.new_schedule:
        raise api_error(
            400,
            "invalid_payment_schedule",
            "The supplied payment schedule is invalid.",
        )

    plan = engine.payments.get_plan(borrower_id)
    now = engine.clock.now()

    updated = PaymentPlan(
        borrower_id=borrower_id,
        original_schedule=deepcopy(plan.original_schedule),
        adjusted_schedule=list(body.new_schedule),
        reason_for_adjustment=body.officer_note,
        updated_by="loan_officer",
        updated_at=now,
    )
    # Use the gateway's public update method if available, fall back to in-memory store.
    if hasattr(engine.payments, "update_plan"):
        engine.payments.update_plan(borrower_id, updated)
    else:
        engine.payments._plans[borrower_id] = updated

    return {
        "status": "updated",
        "updated_at": now,
        "updated_by": "loan_officer",
    }

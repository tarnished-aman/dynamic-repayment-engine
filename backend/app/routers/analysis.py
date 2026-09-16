from fastapi import APIRouter

from app.services.engine import engine

router = APIRouter()


@router.get("/borrower/{borrower_id}/score")
def get_score(borrower_id: str):
    return engine.score(borrower_id)


@router.get("/borrower/{borrower_id}/cashflow-history")
def get_cashflow_history(borrower_id: str):
    return engine.history(borrower_id)


@router.get("/borrower/{borrower_id}/cashflow-analysis")
def get_cashflow_analysis(borrower_id: str):
    return engine.analysis(borrower_id)


@router.get("/borrower/{borrower_id}/risk-flags")
def get_risk_flags(borrower_id: str):
    return engine.risk_flags(borrower_id)


@router.get("/borrower/{borrower_id}/assessment")
def get_assessment(borrower_id: str):
    return engine.assessment(borrower_id)

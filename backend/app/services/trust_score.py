from app.config import Settings, get_settings  # noqa: F401 — kept for callers that pass settings
from app.schemas import BorrowerRecord, ScoreFactor, TrustScoreResponse


UTILITY_WEIGHT = 0.4
SUPPLIER_WEIGHT = 0.3
TOPUP_WEIGHT = 0.3


def _band(score: int) -> str:
    if score >= 80:
        return "high_trust"
    if score >= 50:
        return "medium_trust"
    return "low_trust"


def calculate_trust_score(
    borrower: BorrowerRecord,
    settings: Settings | None = None,  # noqa: ARG001 — reserved for future threshold config
) -> TrustScoreResponse:
    signals = borrower.alternative_signals
    factors = [
        ScoreFactor(
            factor="utility_payments_ontime",
            weight=UTILITY_WEIGHT,
            value=round(signals.utility_on_time_ratio, 2),
        ),
        ScoreFactor(
            factor="supplier_payments_consistent",
            weight=SUPPLIER_WEIGHT,
            value=round(signals.supplier_consistency_ratio, 2),
        ),
        ScoreFactor(
            factor="mobile_topup_frequency",
            weight=TOPUP_WEIGHT,
            value=round(signals.mobile_topup_frequency_score, 2),
        ),
    ]
    raw = sum(item.weight * item.value for item in factors)
    score = int(round(raw * 100))
    return TrustScoreResponse(
        borrower_id=borrower.borrower_id,
        trust_score=score,
        score_band=_band(score),
        score_factors=factors,
        last_updated=signals.last_updated,
    )

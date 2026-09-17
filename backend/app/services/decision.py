from app.config import Settings, get_settings
from app.schemas import CashflowAnalysisResponse, RiskFlagsResponse


def seasonal_match(
    nlp: dict,
    flags: RiskFlagsResponse,
) -> tuple[bool, str, str | None, str | None]:
    """Match reported hardship to current/upcoming flags. Category is never used."""
    if nlp["intent"] != "emergency":
        return False, "none", None, None

    if flags.current_flag != "normal":
        return True, "current", flags.current_flag, None

    if flags.upcoming_flag and flags.upcoming_flag != "normal":
        return True, "upcoming", flags.upcoming_flag, flags.upcoming_flag_month

    return False, "none", None, None


def decide_action(
    nlp: dict,
    analysis: CashflowAnalysisResponse,
    matched: bool,
    match_type: str,
    settings: Settings | None = None,
    matched_flag: str | None = None,
    matched_flag_month: str | None = None,
) -> dict:
    """Return a decision dict consumed directly by the engine and routers.

    Keys
    ----
    cashflow_assessment     : dict with hardship_classification and confidence
    seasonal_match_type     : "current" | "upcoming" | "none"
    matched_flag            : the matched risk flag label, or None
    matched_flag_month      : the month string for an upcoming match, or None
    action_taken            : "auto_relief" | "escalated" | "none"
    decision_explanation    : list[str] of human-readable reasoning steps
    """
    settings = settings or get_settings()
    intent = nlp["intent"]
    confidence = nlp["intent_confidence"]
    hardship = analysis.hardship_classification

    explanation: list[str] = []
    if intent == "emergency":
        explanation.append("Emergency detected from borrower message")
    else:
        explanation.append("No emergency intent detected from the borrower message")

    if match_type == "upcoming":
        explanation.append(
            "Reported hardship aligns with the borrower's upcoming historical seasonal risk window"
        )
    elif match_type == "current":
        explanation.append(
            "Reported hardship aligns with the borrower's current historical seasonal risk window"
        )
    elif intent == "emergency":
        explanation.append("No current or upcoming borrower-specific seasonal risk window matched")

    if analysis.repayment_consistency >= settings.repayment_consistency_threshold:
        explanation.append("Repayment behavior remained largely consistent")
    else:
        explanation.append("Repayment behavior is weaker than the configured consistency threshold")

    explanation.append(f"Cash-flow stress is classified as {hardship}")

    conflicting = hardship == "persistent" and analysis.seasonality_detected

    if intent != "emergency":
        action = "none"
    else:
        auto_relief = (
            confidence >= settings.intent_confidence_threshold
            and matched
            and hardship == "temporary"
            and not conflicting
        )
        action = "auto_relief" if auto_relief else "escalated"

    return {
        "cashflow_assessment": {
            "hardship_classification": hardship,
            "confidence": analysis.confidence,
        },
        "seasonal_match_type": match_type,
        "matched_flag": matched_flag,
        "matched_flag_month": matched_flag_month,
        "action_taken": action,
        "decision_explanation": explanation,
    }

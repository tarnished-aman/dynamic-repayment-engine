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
) -> tuple[str, list[str]]:
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
        return "none", explanation

    auto_relief = (
        confidence >= settings.intent_confidence_threshold
        and matched
        and hardship == "temporary"
        and not conflicting
    )
    if auto_relief:
        return "auto_relief", explanation

    return "escalated", explanation

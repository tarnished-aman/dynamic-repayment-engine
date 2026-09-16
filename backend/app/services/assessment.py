from app.schemas import (
    AssessmentEvidenceItem,
    AssessmentResponse,
    CashflowAnalysisResponse,
    ConversationItem,
    RiskFlagsResponse,
)


def build_assessment(
    analysis: CashflowAnalysisResponse,
    flags: RiskFlagsResponse,
    latest_chat: ConversationItem | None,
) -> AssessmentResponse:
    if latest_chat and latest_chat.action_taken == "auto_relief":
        recommended = "defer_one_installment"
        confidence = 0.91
    elif latest_chat and latest_chat.action_taken == "escalated":
        recommended = "escalate_to_loan_officer"
        confidence = min(analysis.confidence, 0.7)
    elif analysis.hardship_classification == "temporary" and flags.upcoming_flag not in {None, "normal"}:
        recommended = "defer_one_installment"
        confidence = analysis.confidence
    elif analysis.hardship_classification == "persistent":
        recommended = "escalate_to_loan_officer"
        confidence = analysis.confidence
    else:
        recommended = "none"
        confidence = analysis.confidence

    evidence = [
        AssessmentEvidenceItem(
            factor="income_drop",
            impact="high" if analysis.income_change_pct <= -10 else "medium",
            details=f"{abs(analysis.income_change_pct):.0f}% below annual average"
            if analysis.income_change_pct < 0
            else f"{analysis.income_change_pct}% versus annual average",
        ),
        AssessmentEvidenceItem(
            factor="historical_seasonality",
            impact="high" if analysis.seasonality_detected else "low",
            details="Observed during previous years"
            if analysis.seasonality_detected
            else "No repeating seasonal income window detected",
        ),
        AssessmentEvidenceItem(
            factor="repayment_behavior",
            impact="medium" if analysis.repayment_consistency >= 0.85 else "high",
            details=f"{round(analysis.repayment_consistency * 100)}% on-time repayment rate",
        ),
    ]

    if analysis.hardship_classification == "temporary":
        reasoning = (
            "Current hardship appears seasonal and temporary. "
            "Repayment behavior remains strong and there is insufficient evidence of persistent deterioration."
        )
    elif analysis.hardship_classification == "persistent":
        reasoning = (
            "Cash-flow deterioration looks persistent rather than seasonal. "
            "A loan officer should review before any schedule change."
        )
    else:
        reasoning = (
            "Available borrower history is not sufficient to separate temporary seasonal stress "
            "from persistent deterioration."
        )

    if flags.current_flag == "normal" and flags.upcoming_flag and flags.upcoming_flag != "normal":
        reasoning += (
            f" Current risk is normal; the next borrower-specific risk window begins in "
            f"{flags.upcoming_flag_month}."
        )

    return AssessmentResponse(
        borrower_id=analysis.borrower_id,
        final_assessment=analysis.cashflow_status,
        recommended_action=recommended,
        confidence=confidence,
        evidence=evidence,
        generated_reasoning=reasoning,
    )

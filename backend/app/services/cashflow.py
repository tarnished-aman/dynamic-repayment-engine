from app.config import Settings, get_settings
from app.schemas import (
    BorrowerRecord,
    CashflowAnalysisResponse,
    CashflowHistoryResponse,
    MonthlyHistoryItem,
)
from app.services.seasonality import (
    consecutive_decline_months,
    detect_seasonal_pattern,
    seasonality_detected,
    window_records,
)


def _pct_change(recent: float, baseline: float) -> float:
    if baseline == 0:
        return 0.0
    return round(((recent - baseline) / baseline) * 100, 1)


def _trend(incomes: list[float]) -> str:
    if len(incomes) < 4:
        return "stable"
    mid = len(incomes) // 2
    first = sum(incomes[:mid]) / mid
    second = sum(incomes[mid:]) / (len(incomes) - mid)
    if first == 0:
        return "stable"
    delta = (second - first) / first
    if delta <= -0.08:
        return "declining"
    if delta >= 0.08:
        return "improving"
    return "stable"


def _repayment_consistency(rows) -> float:
    if not rows:
        return 0.0
    scores = []
    for row in rows:
        if row.repayment_due <= 0:
            scores.append(1.0)
            continue
        paid_ratio = min(row.loan_repayment / row.repayment_due, 1.0)
        scores.append(paid_ratio if row.on_time else paid_ratio * 0.28)
    return round(sum(scores) / len(scores), 2)


def classify_hardship(
    *,
    income_change_pct: float,
    seasonality: bool,
    repayment_consistency: float,
    decline_streak: int,
    settings: Settings,
) -> tuple[str, str, float, list[str]]:
    income_drop = income_change_pct <= settings.income_drop_threshold_pct
    repayment_ok = repayment_consistency >= settings.repayment_consistency_threshold
    persistent = (
        decline_streak >= settings.persistent_decline_duration_months
        and repayment_consistency < settings.repayment_consistency_threshold
        and not seasonality
    )
    temporary = income_drop and seasonality and repayment_ok

    evidence: list[str] = []
    if income_drop:
        evidence.append(
            f"Income declined {abs(income_change_pct)}% versus the {settings.history_window_months}-month average"
        )
    if seasonality:
        evidence.append("A similar decline was observed during prior lean months in previous years")
    if repayment_ok:
        evidence.append("Repayments remained largely consistent")
    elif repayment_consistency < settings.repayment_consistency_threshold:
        evidence.append("Repayment consistency has fallen below the configured threshold")
    if decline_streak >= settings.persistent_decline_duration_months:
        evidence.append(
            f"Income declined for {decline_streak} consecutive months in the analysis window"
        )

    if persistent:
        return (
            "persistent",
            "persistent_deterioration",
            0.86,
            evidence or ["Income and repayment both deteriorated without a repeating seasonal pattern"],
        )
    if temporary:
        return "temporary", "temporary_stress", 0.88, evidence
    if not income_drop and repayment_ok:
        return (
            "undetermined",
            "healthy",
            0.8,
            evidence or ["Income and repayment are within normal bounds for this borrower"],
        )
    return (
        "undetermined",
        "temporary_stress" if income_drop else "healthy",
        0.55,
        evidence or ["Available evidence is insufficient to classify hardship confidently"],
    )


def cashflow_history(
    borrower: BorrowerRecord,
    settings: Settings | None = None,
) -> CashflowHistoryResponse:
    settings = settings or get_settings()
    rows = window_records(borrower, settings)
    return CashflowHistoryResponse(
        borrower_id=borrower.borrower_id,
        history_window_months=settings.history_window_months,
        monthly_history=[
            MonthlyHistoryItem(
                month=row.month,
                income=row.income,
                expenses=row.expenses,
                loan_repayment=row.loan_repayment,
            )
            for row in rows
        ],
    )


def analyze_cashflow(
    borrower: BorrowerRecord,
    as_of,
    settings: Settings | None = None,
) -> CashflowAnalysisResponse:
    settings = settings or get_settings()
    rows = window_records(borrower, settings)
    avg_income = sum(row.income for row in rows) / len(rows)
    avg_expense = sum(row.expenses for row in rows) / len(rows)
    latest = rows[-1]
    income_change = _pct_change(latest.income, avg_income)
    expense_change = _pct_change(latest.expenses, avg_expense)
    consistency = _repayment_consistency(rows)
    pattern = detect_seasonal_pattern(borrower, settings)
    seasonal = seasonality_detected(pattern)
    decline = consecutive_decline_months(borrower, settings)
    hardship, status, confidence, evidence = classify_hardship(
        income_change_pct=income_change,
        seasonality=seasonal,
        repayment_consistency=consistency,
        decline_streak=decline,
        settings=settings,
    )
    if seasonal and pattern.low_income_months:
        months = "-".join(pattern.low_income_months)
        evidence = [
            (
                f"A similar decline was observed during {months} in previous years"
                if item.startswith("A similar decline was observed")
                else item
            )
            for item in evidence
        ]

    return CashflowAnalysisResponse(
        borrower_id=borrower.borrower_id,
        cashflow_status=status,  # type: ignore[arg-type]
        trend_direction=_trend([row.income for row in rows]),  # type: ignore[arg-type]
        income_change_pct=income_change,
        expense_change_pct=expense_change,
        repayment_consistency=consistency,
        seasonality_detected=seasonal,
        seasonal_pattern=pattern,
        hardship_classification=hardship,  # type: ignore[arg-type]
        confidence=confidence,
        evidence=evidence,
        last_updated=as_of,
    )

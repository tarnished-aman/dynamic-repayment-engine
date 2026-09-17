from calendar import month_abbr
from datetime import date

from app.config import Settings, get_settings
from app.data import abbr_from_key, month_key, shift_month
from app.schemas import BorrowerRecord, CashflowAnalysisResponse, RiskFlagsResponse


def _lookahead_keys(as_of: date, months: int) -> list[str]:
    keys = []
    y, m = as_of.year, as_of.month
    for step in range(1, months + 1):
        ny, nm = shift_month(y, m, step)
        keys.append(month_key(ny, nm))
    return keys


def _flag_type_for_months(
    borrower: BorrowerRecord,
    low_months: list[str],
    settings: Settings,
) -> str:
    if not low_months:
        return "normal"
    rows = [row for row in borrower.monthly_history if abbr_from_key(row.month) in low_months]
    if not rows:
        return "lean_season"
    overall_income = sum(r.income for r in borrower.monthly_history) / len(borrower.monthly_history)
    overall_exp = sum(r.expenses for r in borrower.monthly_history) / len(borrower.monthly_history)
    season_income = sum(r.income for r in rows) / len(rows)
    season_exp = sum(r.expenses for r in rows) / len(rows)
    late_ratio = 1 - (sum(1 for r in rows if r.on_time) / len(rows))
    income_drop = overall_income > 0 and (overall_income - season_income) / overall_income >= (
        settings.seasonality_deviation_pct / 100.0
    )
    expense_up = overall_exp > 0 and (season_exp - overall_exp) / overall_exp >= 0.08
    if expense_up and late_ratio >= 0.15:
        return "festival_slow"
    if income_drop:
        return "lean_season"
    return "lean_season"


def build_risk_flags(
    borrower: BorrowerRecord,
    analysis: CashflowAnalysisResponse,
    as_of: date,
    settings: Settings | None = None,
) -> RiskFlagsResponse:
    settings = settings or get_settings()
    pattern = analysis.seasonal_pattern
    flagged = pattern.low_income_months
    flag_kind = _flag_type_for_months(borrower, flagged, settings)

    current_abbr = month_abbr[as_of.month]
    current_flag = flag_kind if current_abbr in flagged else "normal"

    upcoming_flag = None
    upcoming_month = None
    for key in _lookahead_keys(as_of, settings.seasonality_lookahead_months):
        abbr = abbr_from_key(key)
        if abbr in flagged:
            upcoming_flag = flag_kind
            upcoming_month = abbr
            break

    seasonal_rows = [row for row in borrower.monthly_history if abbr_from_key(row.month) in flagged]
    avg_all = sum(row.income for row in borrower.monthly_history) / max(len(borrower.monthly_history), 1)
    avg_season = (
        sum(row.income for row in seasonal_rows) / len(seasonal_rows) if seasonal_rows else avg_all
    )
    drop = round(((avg_all - avg_season) / avg_all) * 100) if avg_all else 0
    years = sorted({int(row.month.split("-")[0]) for row in seasonal_rows})

    if flagged:
        months_label = "_".join(item.lower() for item in flagged)
        flag_reason = (
            f"borrower_income_has_declined_during_{months_label}_for_{max(len(years), 1)}_consecutive_years"
        )
        supporting = [
            f"Average income drops {drop}% during {'-'.join(flagged)}",
        ]
        late_season = [row for row in seasonal_rows if not row.on_time]
        if late_season:
            supporting.append(
                f"Repayment delays historically increase during {flagged[0]}"
            )
        else:
            supporting.append("The same months show weaker cash inflow across prior years")
    else:
        flag_reason = "no_borrower_specific_seasonal_income_pattern_detected"
        supporting = ["Historical monthly income does not show a repeating lean window"]

    return RiskFlagsResponse(
        borrower_id=borrower.borrower_id,
        analysis_basis="borrower_history",
        current_flag=current_flag,  # type: ignore[arg-type]
        upcoming_flag=upcoming_flag,  # type: ignore[arg-type]
        upcoming_flag_month=upcoming_month,
        flagged_months=flagged,
        flag_reason=flag_reason,
        supporting_evidence=supporting,
    )

from calendar import month_abbr
from collections import defaultdict

from app.config import Settings, get_settings
from app.schemas import BorrowerRecord, SeasonalPattern


def window_records(borrower: BorrowerRecord, settings: Settings | None = None):
    settings = settings or get_settings()
    return borrower.monthly_history[-settings.history_window_months :]


def detect_seasonal_pattern(
    borrower: BorrowerRecord,
    settings: Settings | None = None,
) -> SeasonalPattern:
    """Borrower-specific seasonality from repeating calendar-month income, not category."""
    settings = settings or get_settings()
    history = borrower.monthly_history
    if len(history) < settings.seasonality_minimum_history_months:
        return SeasonalPattern(low_income_months=[], high_income_months=[])

    overall = sum(row.income for row in history) / len(history)
    by_month: dict[int, list[float]] = defaultdict(list)
    for row in history:
        month = int(row.month.split("-")[1])
        by_month[month].append(row.income)

    low: list[str] = []
    high: list[str] = []
    threshold = settings.seasonality_deviation_pct / 100.0
    for month in range(1, 13):
        values = by_month.get(month, [])
        if len(values) < 2:
            continue
        mean = sum(values) / len(values)
        if overall <= 0:
            continue
        delta = (mean - overall) / overall
        label = month_abbr[month]
        if delta <= -threshold:
            low.append(label)
        elif delta >= threshold:
            high.append(label)

    return SeasonalPattern(low_income_months=low, high_income_months=high)


def seasonality_detected(pattern: SeasonalPattern) -> bool:
    return bool(pattern.low_income_months)


def consecutive_decline_months(borrower: BorrowerRecord, settings: Settings | None = None) -> int:
    settings = settings or get_settings()
    rows = window_records(borrower, settings)
    if len(rows) < 2:
        return 0
    streak = 0
    for prev, curr in zip(rows, rows[1:]):
        if curr.income < prev.income:
            streak += 1
        else:
            streak = 0
    return streak

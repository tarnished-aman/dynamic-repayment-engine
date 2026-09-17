from datetime import date, datetime, timedelta

from app.config import Settings, get_settings
from app.schemas import (
    AlternativeSignals,
    BorrowerRecord,
    MonthlyRecord,
    PaymentPlan,
    PaymentScheduleItem,
)


MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def month_key(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}"


def shift_month(year: int, month: int, delta: int) -> tuple[int, int]:
    total = year * 12 + (month - 1) + delta
    return total // 12, total % 12 + 1


def iter_months(end: date, count: int) -> list[str]:
    keys = []
    y, m = end.year, end.month
    for _ in range(count):
        keys.append(month_key(y, m))
        y, m = shift_month(y, m, -1)
    return list(reversed(keys))


def abbr_from_key(key: str) -> str:
    month = int(key.split("-")[1])
    return MONTH_ABBR[month - 1]


def _record(
    key: str,
    income: float,
    expenses: float,
    repayment: float = 2500,
    due: float = 2500,
    on_time: bool = True,
) -> MonthlyRecord:
    return MonthlyRecord(
        month=key,
        income=income,
        expenses=expenses,
        loan_repayment=repayment,
        repayment_due=due,
        on_time=on_time,
    )


def _raju_history() -> list[MonthlyRecord]:
    """
    36 months ending Sep 2026.

    Oct-Nov are structurally low across years (seasonality).
    Sep 2026 is a one-off flood shock so analysis shows ~-18.2% vs 12-month average
    while current_flag stays normal because September is not a seasonal lean month.
    """
    records: list[MonthlyRecord] = []
    end = date(2026, 9, 1)
    for key in iter_months(end, 36):
        year, month = (int(p) for p in key.split("-"))
        on_time = True
        repayment = 2500.0

        if month in (1, 2):
            income = 22000.0 if month == 1 else 23000.0
            expenses = 12000.0
        elif month in (10, 11):
            income = 14000.0 if month == 10 else 13800.0
            expenses = 11800.0
            # Historical Oct delays stay outside the latest 12-month window (2025-10..2026-09)
            # so repayment consistency can remain 0.94 while risk evidence still mentions October.
            if month == 10 and year <= 2024:
                on_time = False
                repayment = 2500.0
        else:
            income = 18200.0
            expenses = 12200.0

        # Contract sample months in the 12-month window
        if key == "2026-01":
            income, expenses = 18000.0, 12000.0
        elif key == "2026-02":
            income, expenses = 19000.0, 12500.0
        elif key == "2026-07":
            income, expenses = 17800.0, 12300.0
        elif key == "2026-08":
            income, expenses = 17000.0, 12400.0
        elif key == "2026-09":
            # Tuned so latest month vs 12-month average is the contract's -18.2%.
            income, expenses = 13943.0, 12580.0

        # One late repayment in the 12-month window besides historical Oct delays
        if key == "2026-04":
            on_time = False

        records.append(_record(key, income, expenses, repayment, 2500.0, on_time))
    return records


def _generic_history(
    end: date,
    months: int,
    income_by_month: dict[int, float],
    expense: float = 11000.0,
    on_time_except: set[str] | None = None,
    recent_income_override: dict[str, float] | None = None,
) -> list[MonthlyRecord]:
    on_time_except = on_time_except or set()
    recent_income_override = recent_income_override or {}
    records = []
    for key in iter_months(end, months):
        month = int(key.split("-")[1])
        income = recent_income_override.get(key, income_by_month.get(month, 15000.0))
        records.append(
            _record(
                key,
                income,
                expense,
                on_time=key not in on_time_except,
            )
        )
    return records


def _installments(start: date, count: int, amount: float) -> list[PaymentScheduleItem]:
    items = []
    y, m = start.year, start.month
    for _ in range(count):
        items.append(
            PaymentScheduleItem(due_date=date(y, m, 1), amount=amount, status="pending")
        )
        y, m = shift_month(y, m, 1)
    return items


def build_borrowers() -> dict[str, BorrowerRecord]:
    raju_schedule = _installments(date(2026, 4, 1), 10, 2500.0)
    for item in raju_schedule:
        if item.due_date < date(2026, 9, 16):
            item.status = "paid"

    meena_income = {m: 16000.0 for m in range(1, 13)}
    meena_income[10] = 12800.0
    meena_income[11] = 12400.0

    # Farmer without a repeating lean window — seasonality must not come from category.
    arjun_income = {m: 20000.0 for m in range(1, 13)}

    kavita_income = {m: 14000.0 for m in range(1, 13)}
    # Vendor with Diwali-period slowdown visible in Oct-Nov spending squeeze (income dip + late pays)
    kavita_income[10] = 10800.0
    kavita_income[11] = 11000.0

    suresh_income = {m: 17000.0 for m in range(1, 13)}
    # Persistent decline: last 6 months trend down, no repeating seasonal pattern
    suresh_overrides = {
        "2026-04": 15000.0,
        "2026-05": 13200.0,
        "2026-06": 11800.0,
        "2026-07": 10500.0,
        "2026-08": 9200.0,
        "2026-09": 8100.0,
    }
    suresh_lates = {"2026-05", "2026-06", "2026-07", "2026-08", "2026-09"}

    priya_income = {m: 15500.0 for m in range(1, 13)}

    return {
        "BOR001": BorrowerRecord(
            borrower_id="BOR001",
            name="Raju Kumar",
            category="farmer",
            language_pref="hi",
            loan_amount=25000,
            loan_start_date=date(2025, 1, 15),
            phone_number="+919876543210",
            monthly_history=_raju_history(),
            alternative_signals=AlternativeSignals(
                last_updated=date(2026, 9, 10),
                utility_on_time_ratio=0.85,
                supplier_consistency_ratio=0.60,
                mobile_topup_frequency_score=0.667,
            ),
            original_schedule=raju_schedule,
        ),
        "BOR002": BorrowerRecord(
            borrower_id="BOR002",
            name="Meena Devi",
            category="farmer",
            language_pref="hi",
            loan_amount=18000,
            loan_start_date=date(2025, 3, 1),
            phone_number="+919811112222",
            monthly_history=_generic_history(date(2026, 9, 1), 36, meena_income),
            alternative_signals=AlternativeSignals(
                last_updated=date(2026, 9, 8),
                utility_on_time_ratio=0.90,
                supplier_consistency_ratio=0.80,
                mobile_topup_frequency_score=0.75,
            ),
            original_schedule=_installments(date(2026, 5, 1), 8, 2250.0),
        ),
        "BOR003": BorrowerRecord(
            borrower_id="BOR003",
            name="Arjun Singh",
            category="farmer",
            language_pref="hi",
            loan_amount=30000,
            loan_start_date=date(2025, 2, 1),
            phone_number="+919822223333",
            monthly_history=_generic_history(date(2026, 9, 1), 36, arjun_income),
            alternative_signals=AlternativeSignals(
                last_updated=date(2026, 9, 5),
                utility_on_time_ratio=0.70,
                supplier_consistency_ratio=0.55,
                mobile_topup_frequency_score=0.50,
            ),
            original_schedule=_installments(date(2026, 6, 1), 8, 2500.0),
        ),
        "BOR004": BorrowerRecord(
            borrower_id="BOR004",
            name="Kavita Sharma",
            category="vendor",
            language_pref="hi",
            loan_amount=12000,
            loan_start_date=date(2025, 4, 10),
            phone_number="+919833334444",
            monthly_history=_generic_history(
                date(2026, 9, 1),
                36,
                kavita_income,
                expense=9500.0,
                on_time_except={"2025-10", "2024-10", "2023-10"},
            ),
            alternative_signals=AlternativeSignals(
                last_updated=date(2026, 9, 9),
                utility_on_time_ratio=0.78,
                supplier_consistency_ratio=0.72,
                mobile_topup_frequency_score=0.80,
            ),
            original_schedule=_installments(date(2026, 7, 1), 6, 2000.0),
        ),
        "BOR005": BorrowerRecord(
            borrower_id="BOR005",
            name="Suresh Yadav",
            category="gig_worker",
            language_pref="hi",
            loan_amount=15000,
            loan_start_date=date(2025, 6, 1),
            phone_number="+919844445555",
            monthly_history=_generic_history(
                date(2026, 9, 1),
                24,
                suresh_income,
                expense=12500.0,
                on_time_except=suresh_lates,
                recent_income_override=suresh_overrides,
            ),
            alternative_signals=AlternativeSignals(
                last_updated=date(2026, 9, 11),
                utility_on_time_ratio=0.40,
                supplier_consistency_ratio=0.35,
                mobile_topup_frequency_score=0.30,
            ),
            original_schedule=_installments(date(2026, 7, 1), 6, 2500.0),
        ),
        "BOR006": BorrowerRecord(
            borrower_id="BOR006",
            name="Priya Nair",
            category="gig_worker",
            language_pref="en",
            loan_amount=10000,
            loan_start_date=date(2026, 6, 1),
            phone_number="+919855556666",
            monthly_history=_generic_history(date(2026, 9, 1), 4, priya_income),
            alternative_signals=AlternativeSignals(
                last_updated=date(2026, 9, 12),
                utility_on_time_ratio=0.95,
                supplier_consistency_ratio=0.90,
                mobile_topup_frequency_score=0.88,
            ),
            original_schedule=_installments(date(2026, 7, 1), 6, 1800.0),
        ),
    }


class InMemoryBorrowerRepository:
    def __init__(self, borrowers: dict[str, BorrowerRecord] | None = None):
        self._borrowers = borrowers or build_borrowers()

    def get_borrower(self, borrower_id: str) -> BorrowerRecord | None:
        return self._borrowers.get(borrower_id)

    def list_borrower_ids(self) -> list[str]:
        return list(self._borrowers.keys())


class InMemoryPaymentPlanGateway:
    """
    Stand-in until Backend B wires SQLite storage.

    Auto-relief rule used by the prototype: defer the installment that falls
    in the upcoming/current risk month (October for Raju) and append a
    replacement installment later.
    """

    def __init__(self, repo: InMemoryBorrowerRepository):
        self._repo = repo
        self._plans: dict[str, PaymentPlan] = {}

    def get_plan(self, borrower_id: str):
        if borrower_id in self._plans:
            return self._plans[borrower_id]
        borrower = self._repo.get_borrower(borrower_id)
        if borrower is None:
            return None
        return PaymentPlan(
            borrower_id=borrower_id,
            original_schedule=list(borrower.original_schedule),
            adjusted_schedule=list(borrower.original_schedule),
            reason_for_adjustment=None,
            updated_by=None,
            updated_at=None,
        )

    def apply_auto_relief(self, borrower_id: str, reason: str, *, updated_at: datetime):
        from copy import deepcopy

        plan = self.get_plan(borrower_id)
        if plan is None:
            raise KeyError(borrower_id)

        original = deepcopy(plan.original_schedule)
        adjusted = deepcopy(original)

        target = None
        for item in adjusted:
            if item.status in {"pending", "overdue"} and item.due_date.month == 10:
                target = item
                break
        if target is None:
            for item in adjusted:
                if item.status in {"pending", "overdue"}:
                    target = item
                    break

        if target is not None:
            deferred_amount = target.amount
            target.amount = 0
            target.status = "deferred"
            add_year, add_month = shift_month(target.due_date.year, target.due_date.month, 3)
            adjusted.append(
                PaymentScheduleItem(
                    due_date=date(add_year, add_month, 1),
                    amount=deferred_amount,
                    status="added",
                )
            )

        updated = PaymentPlan(
            borrower_id=borrower_id,
            original_schedule=original,
            adjusted_schedule=adjusted,
            reason_for_adjustment=reason,
            updated_by="decision_engine",
            updated_at=updated_at,
        )
        self._plans[borrower_id] = updated
        return updated

    def update_plan(self, borrower_id: str, plan) -> None:
        """Directly store an externally constructed plan (e.g. from a loan officer override)."""
        self._plans[borrower_id] = plan


class InMemoryConversationStore:
    def __init__(self):
        self._items: dict[str, list] = {}

    def append(self, borrower_id: str, item) -> None:
        self._items.setdefault(borrower_id, []).append(item)

    def list_for_borrower(self, borrower_id: str):
        return list(self._items.get(borrower_id, []))


class DemoClock:
    def __init__(self, settings: Settings | None = None):
        self._settings = settings or get_settings()

    def today(self) -> date:
        return self._settings.demo_date

    def now(self) -> datetime:
        return datetime.combine(self.today(), datetime.min.time()).replace(
            hour=10, minute=22, second=0
        ) + timedelta(hours=0)

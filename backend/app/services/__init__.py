from datetime import date, datetime
from typing import Protocol

from app.schemas import BorrowerRecord, ConversationItem, PaymentPlan


class BorrowerRepository(Protocol):
    """Data access owned by Backend B. Backend A only reads through this interface."""

    def get_borrower(self, borrower_id: str) -> BorrowerRecord | None: ...

    def list_borrower_ids(self) -> list[str]: ...


class PaymentPlanGateway(Protocol):
    """
    Payment-plan mutations owned by Backend B.

    Backend A must never decide schedule amounts itself beyond requesting
    auto-relief. Backend B applies / validates the actual schedule change.
    """

    def get_plan(self, borrower_id: str) -> PaymentPlan | None: ...

    def apply_auto_relief(
        self,
        borrower_id: str,
        reason: str,
        *,
        updated_at: datetime,
    ) -> PaymentPlan: ...

    def update_plan(self, borrower_id: str, plan: PaymentPlan) -> None: ...


class ConversationStore(Protocol):
    def append(self, borrower_id: str, item: ConversationItem) -> None: ...

    def list_for_borrower(self, borrower_id: str) -> list[ConversationItem]: ...


class Clock(Protocol):
    def today(self) -> date: ...

    def now(self) -> datetime: ...

"""
Backend Support — SQLite payment-schedule mutations.

Called by:
  - backend_b.py  (POST /borrower/{id}/payment-plan/override)
  - engine.py     (auto_relief triggered by the decision engine)
"""

from datetime import datetime

from database import SessionLocal, PaymentSchedule


def apply_auto_relief(borrower_id: str, updated_at: datetime | None = None) -> dict:
    """
    Defer the next pending/overdue installment and add a replacement 3 months later.

    Finds the earliest pending/overdue installment dynamically — no hardcoded dates
    or amounts. Returns a summary dict so callers can log or return it.
    """
    db = SessionLocal()
    try:
        # Find the earliest pending or overdue installment in the adjusted schedule.
        target = (
            db.query(PaymentSchedule)
            .filter(
                PaymentSchedule.borrower_id == borrower_id,
                PaymentSchedule.schedule_type == "adjusted",
                PaymentSchedule.status.in_(["pending", "overdue"]),
            )
            .order_by(PaymentSchedule.due_date)
            .first()
        )

        # If no adjusted schedule exists yet, fall back to the original.
        if target is None:
            target = (
                db.query(PaymentSchedule)
                .filter(
                    PaymentSchedule.borrower_id == borrower_id,
                    PaymentSchedule.schedule_type == "original",
                    PaymentSchedule.status.in_(["pending", "overdue"]),
                )
                .order_by(PaymentSchedule.due_date)
                .first()
            )
            if target is None:
                return {"status": "no_pending_installment", "borrower_id": borrower_id}

            # Copy the full original schedule into the adjusted slot before mutating.
            originals = (
                db.query(PaymentSchedule)
                .filter(
                    PaymentSchedule.borrower_id == borrower_id,
                    PaymentSchedule.schedule_type == "original",
                )
                .all()
            )
            for orig in originals:
                db.add(
                    PaymentSchedule(
                        borrower_id=orig.borrower_id,
                        due_date=orig.due_date,
                        amount=orig.amount,
                        status=orig.status,
                        schedule_type="adjusted",
                    )
                )
            db.flush()

            # Re-query the target from the newly created adjusted rows.
            target = (
                db.query(PaymentSchedule)
                .filter(
                    PaymentSchedule.borrower_id == borrower_id,
                    PaymentSchedule.schedule_type == "adjusted",
                    PaymentSchedule.status.in_(["pending", "overdue"]),
                )
                .order_by(PaymentSchedule.due_date)
                .first()
            )

        deferred_amount = target.amount
        target.amount = 0
        target.status = "deferred"

        # Parse due_date (stored as "YYYY-MM-DD" string in SQLite).
        parts = str(target.due_date).split("-")
        year, month = int(parts[0]), int(parts[1])

        # Add 3 months.
        total = year * 12 + (month - 1) + 3
        new_year, new_month = total // 12, total % 12 + 1
        new_due = f"{new_year:04d}-{new_month:02d}-01"

        db.add(
            PaymentSchedule(
                borrower_id=borrower_id,
                due_date=new_due,
                amount=deferred_amount,
                status="added",
                schedule_type="adjusted",
            )
        )
        db.commit()
        return {
            "status": "relief_applied",
            "borrower_id": borrower_id,
            "deferred_due_date": str(target.due_date),
            "replacement_due_date": new_due,
            "amount": deferred_amount,
        }
    finally:
        db.close()


def override_schedule(borrower_id: str, new_schedule: list[dict]) -> None:
    """
    Replace the adjusted schedule for a borrower with the supplied list.

    Each item in new_schedule must have keys: due_date (str), amount (float), status (str).
    """
    db = SessionLocal()
    try:
        db.query(PaymentSchedule).filter(
            PaymentSchedule.borrower_id == borrower_id,
            PaymentSchedule.schedule_type == "adjusted",
        ).delete()
        for item in new_schedule:
            db.add(
                PaymentSchedule(
                    borrower_id=borrower_id,
                    due_date=str(item["due_date"]),
                    amount=float(item["amount"]),
                    status=str(item["status"]),
                    schedule_type="adjusted",
                )
            )
        db.commit()
    finally:
        db.close()

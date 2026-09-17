from database import SessionLocal, PaymentSchedule

def apply_auto_relief(borrower_id: str):
    db = SessionLocal()

    # find and defer the October installment
    oct_payment = db.query(PaymentSchedule).filter(
        PaymentSchedule.borrower_id == borrower_id,
        PaymentSchedule.due_date == "2026-10-01"
    ).first()

    if oct_payment:
        oct_payment.amount = 0
        oct_payment.status = "deferred"
        oct_payment.schedule_type = "adjusted"

    # add a new January installment
    new_payment = PaymentSchedule(
        borrower_id=borrower_id,
        due_date="2027-01-01",
        amount=2500,
        status="added",
        schedule_type="adjusted"
    )
    db.add(new_payment)
    db.commit()
    db.close()
    return {"status": "relief_applied", "borrower_id": borrower_id}
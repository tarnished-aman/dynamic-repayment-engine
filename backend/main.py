from fastapi import FastAPI, HTTPException, Query
from database import SessionLocal, Borrower, PaymentSchedule, init_db
from services.payment_service import apply_auto_relief
from typing import Optional

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for hackathon purposes, allow everything
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
init_db()

@app.get("/borrower/{id}")
def get_borrower(id: str):
    db = SessionLocal()
    b = db.query(Borrower).filter(Borrower.borrower_id == id).first()
    db.close()
    if not b:
        raise HTTPException(status_code=404, detail={"error": "borrower_not_found", "message": "No borrower exists with the supplied ID.", "status_code": 404})
    return {
        "borrower_id": b.borrower_id,
        "name": b.name,
        "category": b.category,
        "language_pref": b.language_pref,
        "loan_amount": b.loan_amount,
        "loan_start_date": b.loan_start_date,
        "phone_number": b.phone_number
    }

@app.get("/borrowers")
def list_borrowers(category: Optional[str] = None, risk_flag: Optional[str] = None, hardship_classification: Optional[str] = None):
    db = SessionLocal()
    query = db.query(Borrower)
    if category:
        query = query.filter(Borrower.category == category)
    if risk_flag:
        query = query.filter(Borrower.current_flag == risk_flag)
    if hardship_classification:
        query = query.filter(Borrower.hardship_classification == hardship_classification)
    results = query.all()
    db.close()
    return {
        "count": len(results),
        "borrowers": [
            {
                "borrower_id": b.borrower_id,
                "name": b.name,
                "trust_score": b.trust_score,
                "current_flag": b.current_flag,
                "upcoming_flag": b.upcoming_flag,
                "upcoming_flag_month": b.upcoming_flag_month,
                "hardship_classification": b.hardship_classification
            } for b in results
        ]
    }

@app.get("/borrower/{id}/payment-plan")
def get_payment_plan(id: str):
    db = SessionLocal()
    borrower = db.query(Borrower).filter(Borrower.borrower_id == id).first()
    if not borrower:
        db.close()
        raise HTTPException(status_code=404, detail={"error": "borrower_not_found", "message": "No borrower exists with the supplied ID.", "status_code": 404})

    original = db.query(PaymentSchedule).filter(PaymentSchedule.borrower_id == id, PaymentSchedule.schedule_type == "original").all()
    adjusted = db.query(PaymentSchedule).filter(PaymentSchedule.borrower_id == id, PaymentSchedule.schedule_type == "adjusted").all()
    db.close()

    def fmt(rows):
        return [{"due_date": r.due_date, "amount": r.amount, "status": r.status} for r in rows]

    return {
        "borrower_id": id,
        "original_schedule": fmt(original),
        "adjusted_schedule": fmt(adjusted) if adjusted else fmt(original),
        "reason_for_adjustment": "Temporary hardship confirmed through cash-flow analysis and emergency event assessment." if adjusted else None,
        "updated_by": "decision_engine" if adjusted else None,
        "updated_at": "2026-09-16T12:00:00Z" if adjusted else None
    }

from pydantic import BaseModel
from typing import List

class ScheduleItem(BaseModel):
    due_date: str
    amount: float
    status: str

class OverrideRequest(BaseModel):
    new_schedule: List[ScheduleItem]
    officer_note: str = ""

@app.post("/borrower/{id}/payment-plan/override")
def override_payment_plan(id: str, body: OverrideRequest):
    db = SessionLocal()
    borrower = db.query(Borrower).filter(Borrower.borrower_id == id).first()
    if not borrower:
        db.close()
        raise HTTPException(status_code=404, detail={"error": "borrower_not_found", "message": "No borrower exists with the supplied ID.", "status_code": 404})

    if not body.new_schedule or len(body.new_schedule) == 0:
        db.close()
        raise HTTPException(status_code=400, detail={"error": "invalid_payment_schedule", "message": "Schedule cannot be empty.", "status_code": 400})

    for item in body.new_schedule:
        if item.amount < 0:
            db.close()
            raise HTTPException(status_code=400, detail={"error": "invalid_payment_schedule", "message": "Amount cannot be negative.", "status_code": 400})

    db.query(PaymentSchedule).filter(PaymentSchedule.borrower_id == id, PaymentSchedule.schedule_type == "adjusted").delete()
    for item in body.new_schedule:
        db.add(PaymentSchedule(borrower_id=id, due_date=item.due_date, amount=item.amount, status=item.status, schedule_type="adjusted"))
    db.commit()
    db.close()
    return {"status": "updated", "updated_at": "2026-09-16T12:00:00Z", "updated_by": "loan_officer"}
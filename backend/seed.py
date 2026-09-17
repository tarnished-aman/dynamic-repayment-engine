print("SCRIPT STARTED")
import random
from database import SessionLocal, Borrower, PaymentSchedule, init_db

init_db()
db = SessionLocal()

# clear existing data so re-running this script doesn't duplicate rows
db.query(PaymentSchedule).delete()
db.query(Borrower).delete()
db.commit()

categories = ["farmer", "gig_worker", "vendor"]
names = ["Raju Kumar", "Sita Devi", "Manoj Singh", "Priya Sharma", "Vikram Rao",
         "Anita Patel", "Suresh Yadav", "Kavita Joshi", "Ramesh Nair", "Deepa Iyer"]

# BOR001 — must match the demo scenario exactly
raju = Borrower(
    borrower_id="BOR001",
    name="Raju Kumar",
    category="farmer",
    language_pref="hi",
    loan_amount=25000,
    loan_start_date="2025-01-15",
    phone_number="+91XXXXXXXXXX",
    trust_score=72,
    current_flag="normal",
    upcoming_flag="lean_season",
    upcoming_flag_month="Oct",
    hardship_classification="temporary"
)
db.add(raju)

db.add(PaymentSchedule(borrower_id="BOR001", due_date="2026-10-01", amount=2500, status="pending", schedule_type="original"))
db.add(PaymentSchedule(borrower_id="BOR001", due_date="2026-11-01", amount=2500, status="pending", schedule_type="original"))

# 49 more random borrowers
for i in range(2, 51):
    bid = f"BOR{i:03d}"
    cat = random.choice(categories)
    b = Borrower(
        borrower_id=bid,
        name=random.choice(names),
        category=cat,
        language_pref=random.choice(["hi", "en"]),
        loan_amount=random.choice([10000, 15000, 20000, 25000, 30000]),
        loan_start_date="2025-02-01",
        phone_number="+91XXXXXXXXXX",
        trust_score=random.randint(40, 90),
        current_flag=random.choice(["normal", "lean_season", "festival_slow"]),
        upcoming_flag=random.choice([None, "lean_season", "festival_slow"]),
        upcoming_flag_month=random.choice([None, "Oct", "Nov", "Dec"]),
        hardship_classification=random.choice(["temporary", "persistent", "undetermined"])
    )
    db.add(b)
    db.add(PaymentSchedule(borrower_id=bid, due_date="2026-10-01", amount=random.choice([2000,2500,3000]), status="pending", schedule_type="original"))

db.commit()
db.close()
print("ABOUT TO PRINT SUCCESS")
print("Seeded 50 borrowers successfully.")
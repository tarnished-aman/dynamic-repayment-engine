from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine("sqlite:///./app.db")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Borrower(Base):
    __tablename__ = "borrowers"

    borrower_id = Column(String, primary_key=True)
    name = Column(String)
    category = Column(String)
    language_pref = Column(String)
    loan_amount = Column(Float)
    loan_start_date = Column(String)
    phone_number = Column(String)
    trust_score = Column(Integer, default=0)
    current_flag = Column(String, default="normal")
    upcoming_flag = Column(String, nullable=True)
    upcoming_flag_month = Column(String, nullable=True)
    hardship_classification = Column(String, default="undetermined")

class PaymentSchedule(Base):
    __tablename__ = "payment_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    borrower_id = Column(String)
    due_date = Column(String)
    amount = Column(Float)
    status = Column(String)  # pending, paid, deferred, added, overdue
    schedule_type = Column(String)  # "original" or "adjusted"

def init_db():
    Base.metadata.create_all(bind=engine)
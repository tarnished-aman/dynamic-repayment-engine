from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

BorrowerCategory = Literal["farmer", "gig_worker", "vendor"]
RiskFlag = Literal["lean_season", "normal", "festival_slow"]
Intent = Literal["emergency", "no_emergency"]
ActionTaken = Literal["auto_relief", "escalated", "none"]
CashflowStatus = Literal["healthy", "temporary_stress", "persistent_deterioration"]
HardshipClassification = Literal["temporary", "persistent", "undetermined"]
TrendDirection = Literal["improving", "stable", "declining"]
SeasonalMatchType = Literal["current", "upcoming", "none"]
PaymentStatus = Literal["pending", "paid", "deferred", "added", "overdue"]
ScoreBand = Literal["low_trust", "medium_trust", "high_trust"]
InputType = Literal["text", "voice"]
EvidenceImpact = Literal["low", "medium", "high"]


class ScoreFactor(BaseModel):
    factor: str
    weight: float
    value: float


class TrustScoreResponse(BaseModel):
    borrower_id: str
    trust_score: int
    score_band: ScoreBand
    score_factors: list[ScoreFactor]
    last_updated: date


class MonthlyHistoryItem(BaseModel):
    month: str
    income: float
    expenses: float
    loan_repayment: float


class CashflowHistoryResponse(BaseModel):
    borrower_id: str
    history_window_months: int
    monthly_history: list[MonthlyHistoryItem]


class SeasonalPattern(BaseModel):
    low_income_months: list[str]
    high_income_months: list[str]


class CashflowAnalysisResponse(BaseModel):
    borrower_id: str
    cashflow_status: CashflowStatus
    trend_direction: TrendDirection
    income_change_pct: float
    expense_change_pct: float
    repayment_consistency: float
    seasonality_detected: bool
    seasonal_pattern: SeasonalPattern
    hardship_classification: HardshipClassification
    confidence: float
    evidence: list[str]
    last_updated: date


class RiskFlagsResponse(BaseModel):
    borrower_id: str
    analysis_basis: Literal["borrower_history"] = "borrower_history"
    current_flag: RiskFlag
    upcoming_flag: RiskFlag | None
    upcoming_flag_month: str | None
    flagged_months: list[str]
    flag_reason: str
    supporting_evidence: list[str]


class ChatMessageRequest(BaseModel):
    borrower_id: str
    message: str
    language: str = "hi"
    input_type: InputType = "text"


class CashflowAssessmentSlice(BaseModel):
    hardship_classification: HardshipClassification
    confidence: float


class ChatMessageResponse(BaseModel):
    borrower_id: str
    intent: Intent
    extracted_reason: str
    intent_confidence: float
    cashflow_assessment: CashflowAssessmentSlice
    matched_seasonal_flag: bool
    seasonal_match_type: SeasonalMatchType
    matched_flag: RiskFlag | None
    matched_flag_month: str | None
    action_taken: ActionTaken
    decision_explanation: list[str]
    payment_plan_updated: bool
    conversation_id: str


class ConversationItem(BaseModel):
    conversation_id: str
    timestamp: datetime
    message: str
    intent: Intent
    extracted_reason: str
    action_taken: ActionTaken
    seasonal_match_type: SeasonalMatchType


class ChatHistoryResponse(BaseModel):
    borrower_id: str
    conversations: list[ConversationItem]


class AssessmentEvidenceItem(BaseModel):
    factor: str
    impact: EvidenceImpact
    details: str


class AssessmentResponse(BaseModel):
    borrower_id: str
    final_assessment: CashflowStatus
    recommended_action: str
    confidence: float
    evidence: list[AssessmentEvidenceItem]
    generated_reasoning: str


class PaymentScheduleItem(BaseModel):
    due_date: date
    amount: float
    status: PaymentStatus


class PaymentPlan(BaseModel):
    borrower_id: str
    original_schedule: list[PaymentScheduleItem]
    adjusted_schedule: list[PaymentScheduleItem]
    reason_for_adjustment: str | None = None
    updated_by: str | None = None
    updated_at: datetime | None = None


class MonthlyRecord(BaseModel):
    month: str
    income: float
    expenses: float
    loan_repayment: float
    repayment_due: float = 2500
    on_time: bool = True


class AlternativeSignals(BaseModel):
    last_updated: date
    utility_on_time_ratio: float = Field(ge=0, le=1)
    supplier_consistency_ratio: float = Field(ge=0, le=1)
    mobile_topup_frequency_score: float = Field(ge=0, le=1)


class BorrowerRecord(BaseModel):
    borrower_id: str
    name: str
    category: BorrowerCategory
    language_pref: str
    loan_amount: float
    loan_start_date: date
    phone_number: str
    monthly_history: list[MonthlyRecord]
    alternative_signals: AlternativeSignals
    original_schedule: list[PaymentScheduleItem]

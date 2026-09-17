export type BorrowerCategory = "farmer" | "gig_worker" | "vendor";
export type RiskFlag = "lean_season" | "normal" | "festival_slow";
export type HardshipClassification = "temporary" | "persistent" | "undetermined";
export type CashflowStatus =
  | "healthy"
  | "temporary_stress"
  | "persistent_deterioration";
export type TrendDirection = "improving" | "stable" | "declining";
export type PaymentStatus = "pending" | "paid" | "deferred" | "added" | "overdue";
export type ScoreBand = "low_trust" | "medium_trust" | "high_trust";
export type EvidenceImpact = "high" | "medium" | "low";

export type ScoreFactor = {
  factor: string;
  weight: number;
  value: number;
};

export type TrustScore = {
  borrower_id: string;
  trust_score: number;
  score_band: ScoreBand;
  score_factors: ScoreFactor[];
  last_updated: string;
};

export type MonthlyHistory = {
  month: string;
  income: number;
  expenses: number;
  loan_repayment: number;
};

export type CashFlowHistory = {
  borrower_id: string;
  history_window_months: number;
  monthly_history: MonthlyHistory[];
};

export type SeasonalPattern = {
  low_income_months: string[];
  high_income_months: string[];
};

export type CashFlowAnalysis = {
  borrower_id: string;
  cashflow_status: CashflowStatus;
  trend_direction: TrendDirection;
  income_change_pct: number;
  expense_change_pct: number;
  repayment_consistency: number;
  seasonality_detected: boolean;
  seasonal_pattern: SeasonalPattern;
  hardship_classification: HardshipClassification;
  confidence: number;
  evidence: string[];
  last_updated: string;
};

export type RiskFlags = {
  borrower_id: string;
  analysis_basis: string;
  current_flag: RiskFlag;
  upcoming_flag: RiskFlag | null;
  upcoming_flag_month: string | null;
  flagged_months: string[];
  flag_reason: string;
  supporting_evidence: string[];
};

export type AssessmentEvidence = {
  factor: string;
  impact: EvidenceImpact;
  details: string;
};

export type Assessment = {
  borrower_id: string;
  final_assessment: string;
  recommended_action: string;
  confidence: number;
  evidence: AssessmentEvidence[];
  generated_reasoning: string;
};

export type PaymentScheduleItem = {
  due_date: string;
  amount: number;
  status: PaymentStatus;
};

export type PaymentPlan = {
  borrower_id: string;
  original_schedule: PaymentScheduleItem[];
  adjusted_schedule: PaymentScheduleItem[];
  reason_for_adjustment: string;
  updated_by: string;
  updated_at: string;
};

export type BorrowerSummary = {
  borrower_id: string;
  name: string;
  trust_score: number;
  current_flag: RiskFlag;
  upcoming_flag: RiskFlag | null;
  upcoming_flag_month: string | null;
  hardship_classification: HardshipClassification;
  category?: BorrowerCategory;
};

export type EvidenceItem = string | AssessmentEvidence;

import type {
  Assessment,
  BorrowerSummary,
  CashFlowAnalysis,
  CashFlowHistory,
  PaymentPlan,
  RiskFlags,
  TrustScore,
} from "@/types";

export const mockTrustScore: TrustScore = {
  borrower_id: "BOR001",
  trust_score: 72,
  score_band: "medium_trust",
  score_factors: [
    { factor: "utility_payments_ontime", weight: 0.4, value: 0.85 },
    { factor: "supplier_payments_consistent", weight: 0.3, value: 0.6 },
    { factor: "mobile_topup_frequency", weight: 0.3, value: 0.7 },
  ],
  last_updated: "2026-09-10",
};

export const mockCashFlowHistory: CashFlowHistory = {
  borrower_id: "BOR001",
  history_window_months: 12,
  monthly_history: [
    { month: "2025-10", income: 14200, expenses: 11800, loan_repayment: 2500 },
    { month: "2025-11", income: 13800, expenses: 12100, loan_repayment: 2500 },
    { month: "2025-12", income: 16500, expenses: 12400, loan_repayment: 2500 },
    { month: "2026-01", income: 18000, expenses: 12000, loan_repayment: 2500 },
    { month: "2026-02", income: 19000, expenses: 12500, loan_repayment: 2500 },
    { month: "2026-03", income: 17600, expenses: 12300, loan_repayment: 2500 },
    { month: "2026-04", income: 16800, expenses: 12200, loan_repayment: 2500 },
    { month: "2026-05", income: 17200, expenses: 12600, loan_repayment: 2500 },
    { month: "2026-06", income: 16900, expenses: 12450, loan_repayment: 2500 },
    { month: "2026-07", income: 16100, expenses: 12700, loan_repayment: 2500 },
    { month: "2026-08", income: 15400, expenses: 12800, loan_repayment: 2500 },
    { month: "2026-09", income: 13900, expenses: 12650, loan_repayment: 2500 },
  ],
};

export const mockCashFlowAnalysis: CashFlowAnalysis = {
  borrower_id: "BOR001",
  cashflow_status: "temporary_stress",
  trend_direction: "stable",
  income_change_pct: -18.2,
  expense_change_pct: 3.1,
  repayment_consistency: 0.94,
  seasonality_detected: true,
  seasonal_pattern: {
    low_income_months: ["Oct", "Nov"],
    high_income_months: ["Jan", "Feb"],
  },
  hardship_classification: "temporary",
  confidence: 0.88,
  evidence: [
    "Income declined 18.2% versus the 12-month average",
    "A similar decline was observed during Oct-Nov in previous years",
    "Repayments remained largely consistent",
  ],
  last_updated: "2026-09-16",
};

export const mockRiskFlags: RiskFlags = {
  borrower_id: "BOR001",
  analysis_basis: "borrower_history",
  current_flag: "normal",
  upcoming_flag: "lean_season",
  upcoming_flag_month: "Oct",
  flagged_months: ["Oct", "Nov"],
  flag_reason:
    "borrower_income_has_declined_during_oct_nov_for_3_consecutive_years",
  supporting_evidence: [
    "Average income drops 22% during Oct-Nov",
    "Repayment delays historically increase during Oct",
  ],
};

export const mockAssessment: Assessment = {
  borrower_id: "BOR001",
  final_assessment: "temporary_stress",
  recommended_action: "defer_one_installment",
  confidence: 0.91,
  evidence: [
    {
      factor: "income_drop",
      impact: "high",
      details: "18% below annual average",
    },
    {
      factor: "historical_seasonality",
      impact: "high",
      details: "Observed during previous years",
    },
    {
      factor: "repayment_behavior",
      impact: "medium",
      details: "94% on-time repayment rate",
    },
  ],
  generated_reasoning:
    "Current hardship appears seasonal and temporary. Repayment behavior remains strong and there is insufficient evidence of persistent deterioration.",
};

export const mockPaymentPlan: PaymentPlan = {
  borrower_id: "BOR001",
  original_schedule: [
    { due_date: "2026-09-01", amount: 2500, status: "paid" },
    { due_date: "2026-10-01", amount: 2500, status: "pending" },
    { due_date: "2026-11-01", amount: 2500, status: "pending" },
    { due_date: "2026-12-01", amount: 2500, status: "pending" },
    { due_date: "2027-01-01", amount: 2500, status: "pending" },
  ],
  adjusted_schedule: [
    { due_date: "2026-09-01", amount: 2500, status: "paid" },
    { due_date: "2026-10-01", amount: 0, status: "deferred" },
    { due_date: "2026-11-01", amount: 2500, status: "pending" },
    { due_date: "2026-12-01", amount: 2500, status: "pending" },
    { due_date: "2027-01-01", amount: 2500, status: "added" },
  ],
  reason_for_adjustment:
    "Temporary hardship confirmed through cash-flow analysis and emergency event assessment.",
  updated_by: "decision_engine",
  updated_at: "2026-09-16T12:00:00Z",
};

export const mockBorrowers: BorrowerSummary[] = [
  {
    borrower_id: "BOR001",
    name: "Raju Kumar",
    trust_score: 72,
    current_flag: "normal",
    upcoming_flag: "lean_season",
    upcoming_flag_month: "Oct",
    hardship_classification: "temporary",
    category: "farmer",
  },
  {
    borrower_id: "BOR014",
    name: "Meera Devi",
    trust_score: 81,
    current_flag: "festival_slow",
    upcoming_flag: "normal",
    upcoming_flag_month: "Nov",
    hardship_classification: "temporary",
    category: "vendor",
  },
  {
    borrower_id: "BOR027",
    name: "Imran Shaikh",
    trust_score: 54,
    current_flag: "lean_season",
    upcoming_flag: null,
    upcoming_flag_month: null,
    hardship_classification: "persistent",
    category: "gig_worker",
  },
  {
    borrower_id: "BOR033",
    name: "Lakshmi Nair",
    trust_score: 88,
    current_flag: "normal",
    upcoming_flag: null,
    upcoming_flag_month: null,
    hardship_classification: "undetermined",
    category: "vendor",
  },
];

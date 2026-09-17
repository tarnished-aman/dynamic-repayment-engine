/**
 * Frontend API client for the Dynamic Risk & Repayment Engine.
 * 
 * Calls the FastAPI backend at localhost:8000 by default.
 * Override with NEXT_PUBLIC_API_URL environment variable.
 */

import type {
  Assessment,
  BorrowerSummary,
  CashFlowAnalysis,
  CashFlowHistory,
  PaymentPlan,
  RiskFlags,
  TrustScore,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * GET /borrowers
 * Returns all borrowers with optional filtering.
 */
export async function getBorrowers(params?: {
  category?: string;
  risk_flag?: string;
  hardship_classification?: string;
}): Promise<{ count: number; borrowers: BorrowerSummary[] }> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.risk_flag) query.set("risk_flag", params.risk_flag);
  if (params?.hardship_classification)
    query.set("hardship_classification", params.hardship_classification);

  const url = `${BASE_URL}/borrowers${query.toString() ? `?${query}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch borrowers: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * GET /borrower/{id}/score
 */
export async function getTrustScore(id: string): Promise<TrustScore> {
  const res = await fetch(`${BASE_URL}/borrower/${id}/score`);
  if (!res.ok) {
    throw new Error(`Failed to fetch trust score: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * GET /borrower/{id}/cashflow-history
 */
export async function getCashFlowHistory(id: string): Promise<CashFlowHistory> {
  const res = await fetch(`${BASE_URL}/borrower/${id}/cashflow-history`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cash flow history: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * GET /borrower/{id}/cashflow-analysis
 */
export async function getCashFlowAnalysis(id: string): Promise<CashFlowAnalysis> {
  const res = await fetch(`${BASE_URL}/borrower/${id}/cashflow-analysis`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch cash flow analysis: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

/**
 * GET /borrower/{id}/risk-flags
 */
export async function getRiskFlags(id: string): Promise<RiskFlags> {
  const res = await fetch(`${BASE_URL}/borrower/${id}/risk-flags`);
  if (!res.ok) {
    throw new Error(`Failed to fetch risk flags: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * GET /borrower/{id}/assessment
 */
export async function getAssessment(id: string): Promise<Assessment> {
  const res = await fetch(`${BASE_URL}/borrower/${id}/assessment`);
  if (!res.ok) {
    throw new Error(`Failed to fetch assessment: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * GET /borrower/{id}/payment-plan
 */
export async function getPaymentPlan(id: string): Promise<PaymentPlan> {
  const res = await fetch(`${BASE_URL}/borrower/${id}/payment-plan`);
  if (!res.ok) {
    throw new Error(`Failed to fetch payment plan: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * POST /chat/message
 */
export async function sendChatMessage(
  borrowerId: string,
  message: string,
  language: string = "hi",
  inputType: "text" | "voice" = "text"
): Promise<{
  borrower_id: string;
  intent: "emergency" | "no_emergency";
  extracted_reason: string;
  intent_confidence: number;
  cashflow_assessment: { hardship_classification: string; confidence: number };
  matched_seasonal_flag: boolean;
  seasonal_match_type: "current" | "upcoming" | "none";
  matched_flag: string | null;
  matched_flag_month: string | null;
  action_taken: "auto_relief" | "escalated" | "none";
  decision_explanation: string[];
  payment_plan_updated: boolean;
  conversation_id: string;
}> {
  const res = await fetch(`${BASE_URL}/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      borrower_id: borrowerId,
      message,
      language,
      input_type: inputType,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to send message: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * GET /chat/history/{borrower_id}
 */
export async function getChatHistory(
  borrowerId: string
): Promise<{
  borrower_id: string;
  conversations: Array<{
    conversation_id: string;
    timestamp: string;
    message: string;
    intent: string;
    extracted_reason: string;
    action_taken: string;
    seasonal_match_type: string;
  }>;
}> {
  const res = await fetch(`${BASE_URL}/chat/history/${borrowerId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch chat history: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

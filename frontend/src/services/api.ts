import {
  mockAssessment,
  mockBorrowers,
  mockCashFlowAnalysis,
  mockCashFlowHistory,
  mockPaymentPlan,
  mockRiskFlags,
  mockTrustScore,
} from "@/data/mock";

export async function getBorrowers() {
  return mockBorrowers;
}

export async function getTrustScore(_id: string) {
  return mockTrustScore;
}

export async function getCashFlowHistory(_id: string) {
  return mockCashFlowHistory;
}

export async function getCashFlowAnalysis(_id: string) {
  return mockCashFlowAnalysis;
}

export async function getRiskFlags(_id: string) {
  return mockRiskFlags;
}

export async function getAssessment(_id: string) {
  return mockAssessment;
}

export async function getPaymentPlan(_id: string) {
  return mockPaymentPlan;
}

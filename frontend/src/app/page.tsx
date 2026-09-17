"use client";

import { useEffect, useState } from "react";
import {
  AssessmentCard,
  BorrowerTable,
  CashFlowChart,
  CashFlowStatusCard,
  PaymentPlanTable,
  RiskCard,
  TrustScoreCard,
} from "@/components";
import { ChatPanel } from "@/components/chat-panel";
import * as api from "@/services/api";
import type {
  Assessment,
  BorrowerSummary,
  CashFlowAnalysis,
  CashFlowHistory,
  PaymentPlan,
  RiskFlags,
  TrustScore,
} from "@/types";

export default function DashboardPage() {
  const [borrowers, setBorrowers] = useState<BorrowerSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Borrower data
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [cashFlowHistory, setCashFlowHistory] = useState<CashFlowHistory | null>(null);
  const [cashFlowAnalysis, setCashFlowAnalysis] = useState<CashFlowAnalysis | null>(null);
  const [riskFlags, setRiskFlags] = useState<RiskFlags | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load borrower list on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getBorrowers();
        setBorrowers(data.borrowers);
        // Auto-select BOR001 if available
        if (data.borrowers.length > 0) {
          const defaultBorrower = data.borrowers.find((b) => b.borrower_id === "BOR001") || data.borrowers[0];
          setSelectedId(defaultBorrower.borrower_id);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load borrowers");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load borrower details when selection changes
  useEffect(() => {
    if (!selectedId) return;

    async function loadDetails() {
      try {
        setLoadingDetails(true);
        const [score, history, analysis, flags, assess, plan] = await Promise.all([
          api.getTrustScore(selectedId),
          api.getCashFlowHistory(selectedId),
          api.getCashFlowAnalysis(selectedId),
          api.getRiskFlags(selectedId).catch(() => null), // 422 for insufficient history
          api.getAssessment(selectedId),
          api.getPaymentPlan(selectedId),
        ]);
        setTrustScore(score);
        setCashFlowHistory(history);
        setCashFlowAnalysis(analysis);
        setRiskFlags(flags);
        setAssessment(assess);
        setPaymentPlan(plan);
      } catch (err) {
        console.error("Failed to load borrower details:", err);
      } finally {
        setLoadingDetails(false);
      }
    }
    loadDetails();
  }, [selectedId]);

  // Refresh payment plan and assessment after chat action
  async function handleChatAction() {
    if (!selectedId) return;
    try {
      const [newPlan, newAssessment] = await Promise.all([
        api.getPaymentPlan(selectedId),
        api.getAssessment(selectedId),
      ]);
      setPaymentPlan(newPlan);
      setAssessment(newAssessment);
    } catch (err) {
      console.error("Failed to refresh after chat action:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0d] text-zinc-400">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0d] text-zinc-400">
        <p className="text-red-400">{error}</p>
        <p className="text-sm">Make sure the backend is running at http://localhost:8000</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm text-emerald-950"
        >
          Retry
        </button>
      </div>
    );
  }

  const selectedBorrower = borrowers.find((b) => b.borrower_id === selectedId);

  return (
    <div className="flex h-screen bg-[#0a0a0d]">
      {/* Chat panel */}
      {selectedId && (
        <ChatPanel
          borrowerId={selectedId}
          language="hi"
          onActionTaken={handleChatAction}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                Loan Officer Dashboard
              </p>
              <h1 className="mt-2 font-serif text-4xl tracking-tight text-zinc-100">
                {selectedBorrower?.name || "Select a borrower"} · {selectedId || "—"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Dynamic risk assessment and repayment engine powered by borrower-specific
                cashflow analysis and seasonal pattern detection.
              </p>
            </div>
            <p className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-zinc-400 shadow-lg">
              Demo date 16 Sep 2026 · {selectedBorrower?.category || "—"}
            </p>
          </header>

          {/* Borrower table */}
          <div className="mb-6">
            <BorrowerTable
              borrowers={borrowers}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {loadingDetails && (
            <div className="py-12 text-center text-zinc-500">Loading borrower details...</div>
          )}

          {!loadingDetails && selectedId && (
            <div className="grid gap-6 lg:grid-cols-2">
              {trustScore && <TrustScoreCard data={trustScore} />}
              {cashFlowAnalysis && <CashFlowStatusCard data={cashFlowAnalysis} />}
              {cashFlowHistory && (
                <div className="lg:col-span-2">
                  <CashFlowChart monthlyHistory={cashFlowHistory.monthly_history} />
                </div>
              )}
              {riskFlags && <RiskCard data={riskFlags} />}
              {assessment && <AssessmentCard data={assessment} />}
              {paymentPlan && (
                <div className="lg:col-span-2">
                  <PaymentPlanTable data={paymentPlan} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

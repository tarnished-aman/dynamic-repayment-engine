import {
  AssessmentCard,
  BorrowerTable,
  CashFlowChart,
  CashFlowStatusCard,
  PaymentPlanTable,
  RiskCard,
  TrustScoreCard,
} from "@/components";
import {
  mockAssessment,
  mockBorrowers,
  mockCashFlowAnalysis,
  mockCashFlowHistory,
  mockPaymentPlan,
  mockRiskFlags,
  mockTrustScore,
} from "@/data/mock";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">
            Loan officer canvas
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-ink">
            Raju Kumar · BOR001
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            Reusable visual components rendered from mock API-contract data.
            Swap `src/services/api.ts` to the FastAPI backend when it is ready.
          </p>
        </div>
        <p className="rounded-full bg-paper-raised px-4 py-2 text-xs text-ink-muted shadow-card">
          Demo date 16 Sep 2026 · Farmer · ₹25,000 loan
        </p>
      </header>

      <div className="mb-6">
        <BorrowerTable borrowers={mockBorrowers} selectedId="BOR001" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrustScoreCard data={mockTrustScore} />
        <CashFlowStatusCard data={mockCashFlowAnalysis} />
        <div className="lg:col-span-2">
          <CashFlowChart monthlyHistory={mockCashFlowHistory.monthly_history} />
        </div>
        <RiskCard data={mockRiskFlags} />
        <AssessmentCard data={mockAssessment} />
        <div className="lg:col-span-2">
          <PaymentPlanTable data={mockPaymentPlan} />
        </div>
      </div>
    </main>
  );
}

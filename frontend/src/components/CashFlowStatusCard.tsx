import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatPercent } from "@/lib/format";
import type { CashFlowAnalysis } from "@/types";

type CashFlowStatusCardProps = {
  data: CashFlowAnalysis;
};

export function CashFlowStatusCard({ data }: CashFlowStatusCardProps) {
  return (
    <article className="rounded-2xl bg-paper-raised p-5 shadow-card ring-1 ring-ink/5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Cash-flow status
          </p>
          <h2 className="mt-1 font-serif text-xl text-ink">Hardship classification</h2>
        </div>
        <StatusBadge value={data.cashflow_status} />
      </header>

      <dl className="grid grid-cols-2 gap-3">
        <Metric
          label="Income change"
          value={formatPercent(data.income_change_pct)}
          accent={data.income_change_pct < 0 ? "clay" : "teal"}
        />
        <Metric
          label="Expense change"
          value={formatPercent(data.expense_change_pct)}
        />
        <Metric
          label="Repayment consistency"
          value={formatPercent(data.repayment_consistency, true)}
        />
        <Metric
          label="Confidence"
          value={formatPercent(data.confidence, true)}
        />
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge value={data.trend_direction} />
        <StatusBadge value={data.hardship_classification} />
        {data.seasonality_detected ? (
          <StatusBadge value="seasonality_detected" label="Seasonality" />
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-ink-muted">
        Low months {data.seasonal_pattern.low_income_months.join(", ")} · High months{" "}
        {data.seasonal_pattern.high_income_months.join(", ")}
      </p>
      <p className="mt-1 text-[11px] text-ink-muted">
        Updated {formatDate(data.last_updated)}
      </p>
    </article>
  );
}

function Metric({
  label,
  value,
  accent = "ink",
}: {
  label: string;
  value: string;
  accent?: "ink" | "teal" | "clay";
}) {
  const color =
    accent === "teal" ? "text-teal" : accent === "clay" ? "text-clay" : "text-ink";
  return (
    <div className="rounded-xl bg-paper px-3 py-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className={`mt-0.5 font-serif text-lg ${color}`}>{value}</dd>
    </div>
  );
}

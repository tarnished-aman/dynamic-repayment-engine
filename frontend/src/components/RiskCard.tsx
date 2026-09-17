import { StatusBadge } from "@/components/StatusBadge";
import { EvidenceList } from "@/components/EvidenceList";
import { humanize } from "@/lib/format";
import type { RiskFlags } from "@/types";

type RiskCardProps = {
  data: RiskFlags;
};

export function RiskCard({ data }: RiskCardProps) {
  return (
    <article className="rounded-2xl bg-paper-raised p-5 shadow-card ring-1 ring-ink/5">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
          Seasonal risk
        </p>
        <h2 className="mt-1 font-serif text-xl text-ink">Borrower-specific flags</h2>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-paper px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-muted">Current</p>
          <div className="mt-2">
            <StatusBadge value={data.current_flag} />
          </div>
        </div>
        <div className="rounded-xl bg-paper px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-muted">
            Upcoming {data.upcoming_flag_month ? `· ${data.upcoming_flag_month}` : ""}
          </p>
          <div className="mt-2">
            {data.upcoming_flag ? (
              <StatusBadge value={data.upcoming_flag} />
            ) : (
              <span className="text-sm text-ink-muted">None in lookahead</span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-ink">
        {humanize(data.flag_reason)}. Flagged months: {data.flagged_months.join(", ")}.
      </p>

      <EvidenceList items={data.supporting_evidence} title="Supporting evidence" />
    </article>
  );
}

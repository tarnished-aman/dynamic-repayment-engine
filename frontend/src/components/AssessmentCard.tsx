import { StatusBadge } from "@/components/StatusBadge";
import { EvidenceList } from "@/components/EvidenceList";
import { formatPercent, humanize } from "@/lib/format";
import type { Assessment } from "@/types";

type AssessmentCardProps = {
  data: Assessment;
};

export function AssessmentCard({ data }: AssessmentCardProps) {
  return (
    <article className="rounded-2xl bg-paper-raised p-5 shadow-card ring-1 ring-ink/5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            System assessment
          </p>
          <h2 className="mt-1 font-serif text-xl capitalize text-ink">
            {humanize(data.final_assessment)}
          </h2>
        </div>
        <div className="text-right">
          <StatusBadge value={data.recommended_action} />
          <p className="mt-2 text-[11px] text-ink-muted">
            Confidence {formatPercent(data.confidence, true)}
          </p>
        </div>
      </header>

      <p className="rounded-xl bg-teal px-4 py-3 text-sm leading-6 text-paper-raised">
        {data.generated_reasoning}
      </p>
      <p className="mt-2 text-[11px] text-ink-muted">
        Prototype recommendation — not a loan-officer decision.
      </p>

      <EvidenceList items={data.evidence} />
    </article>
  );
}

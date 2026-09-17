import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatPercent, humanize } from "@/lib/format";
import type { TrustScore } from "@/types";

type TrustScoreCardProps = {
  data: TrustScore;
};

export function TrustScoreCard({ data }: TrustScoreCardProps) {
  const circumference = 2 * Math.PI * 42;
  const progress = (data.trust_score / 100) * circumference;

  return (
    <article className="rounded-2xl bg-paper-raised p-5 shadow-card ring-1 ring-ink/5">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Trust score
          </p>
          <h2 className="mt-1 font-serif text-xl text-ink">Alternative-data signal</h2>
        </div>
        <StatusBadge value={data.score_band} />
      </header>

      <div className="flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e7e1d6"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#0f5f56"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-3xl leading-none text-ink">
              {data.trust_score}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-ink-muted">
              / 100
            </span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-3">
          {data.score_factors.map((factor) => (
            <li key={factor.factor}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-ink">{humanize(factor.factor)}</span>
                <span className="shrink-0 text-ink-muted">
                  {formatPercent(factor.value, true)} · w {formatPercent(factor.weight, true)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: `${factor.value * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[11px] text-ink-muted">
        Updated {formatDate(data.last_updated)}
      </p>
    </article>
  );
}

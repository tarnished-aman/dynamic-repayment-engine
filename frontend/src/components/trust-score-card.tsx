interface ScoreFactor {
  factor: string
  weight: number
  value: number
}

interface TrustScoreCardProps {
  trustScore: number
  scoreBand: string
  scoreFactors: ScoreFactor[]
}

const SEGMENTS = 17

const BAND_LABELS: Record<string, string> = {
  low_trust: "Low Trust",
  medium_trust: "Medium Trust",
  high_trust: "High Trust",
}

function formatFactorLabel(factor: string) {
  return factor
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function TrustScoreCard({ trustScore, scoreBand, scoreFactors }: TrustScoreCardProps) {
  const filled = Math.round((trustScore / 100) * SEGMENTS)

  return (
    <section className="rounded-xl border border-white/8 bg-[#131316] p-5">
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Trust Score</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">Range 0–100</span>
      </div>

      <div className="flex items-end gap-2 pt-4">
        <span className="font-mono text-5xl font-bold leading-none tabular-nums text-emerald-400 [text-shadow:0_0_24px_rgb(52_211_153_/_0.35)]">
          {trustScore}
        </span>
        <span className="font-mono text-lg leading-none text-zinc-600">/100</span>
      </div>

      <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
        {BAND_LABELS[scoreBand] ?? scoreBand}
      </p>

      {/* Segmented progress indicator */}
      <div className="mt-4 flex gap-1">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={`h-6 flex-1 rounded-sm ${
              i < filled ? "bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/40" : "border border-white/10 bg-white/[0.02]"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2 border-t border-white/8 pt-3">
        {scoreFactors.map((f) => (
          <div key={f.factor} className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {formatFactorLabel(f.factor)}
            </p>
            <p className="font-mono text-sm font-semibold tabular-nums text-zinc-100">
              {Math.round(f.value * 100)}%
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
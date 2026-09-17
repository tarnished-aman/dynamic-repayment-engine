interface RiskFlagCardProps {
  currentFlag: string
  upcomingFlag: string | null
  upcomingFlagMonth: string | null
  flagReason: string
  supportingEvidence: string[]
}

const FLAG_LABELS: Record<string, string> = {
  normal: "Normal",
  lean_season: "Lean Season",
  festival_slow: "Festival Slow",
}

function formatReason(reason: string) {
  return reason.split("_").join(" ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function RiskFlagCard({
  currentFlag,
  upcomingFlag,
  upcomingFlagMonth,
  flagReason,
  supportingEvidence,
}: RiskFlagCardProps) {
  const isCurrentNormal = currentFlag === "normal"

  return (
    <section className="rounded-xl border border-white/8 bg-[#131316] p-5">
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Risk Flag</h2>
        <span
          className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${
            isCurrentNormal ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isCurrentNormal
                ? "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/70"
                : "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/70"
            }`}
          />
          Current: {FLAG_LABELS[currentFlag] ?? currentFlag}
        </span>
      </div>

      {upcomingFlag && (
        <div className="mt-4 rounded-md border-l-2 border-amber-400 bg-amber-400/[0.06] py-3 pl-3 pr-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-100">
              Upcoming: {FLAG_LABELS[upcomingFlag] ?? upcomingFlag}
            </p>
            {upcomingFlagMonth && (
              <span className="font-mono text-[10px] text-amber-400/80">Starts {upcomingFlagMonth}</span>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-zinc-400">{formatReason(flagReason)}</p>
        </div>
      )}

      {supportingEvidence.length > 0 && (
        <div className="mt-4 space-y-0 divide-y divide-white/8 border-t border-white/8">
          {supportingEvidence.map((evidence, i) => (
            <div key={i} className="py-2">
              <span className="font-mono text-[11px] text-zinc-400">{evidence}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
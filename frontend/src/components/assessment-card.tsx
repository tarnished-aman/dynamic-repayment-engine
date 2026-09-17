interface AssessmentCardProps {
  finalAssessment: string
  recommendedAction: string
  confidence: number
  reasoning: string
}

export function AssessmentCard({ finalAssessment, recommendedAction, confidence, reasoning }: AssessmentCardProps) {
  return (
    <section className="flex flex-col rounded-xl border border-white/8 bg-[#131316] p-5">
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Assessment</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{finalAssessment}</span>
      </div>

      <div className="mt-4 space-y-3 divide-y divide-white/8">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-zinc-300">Recommended action</span>
          <span className="font-mono text-[11px] font-semibold text-emerald-400">{recommendedAction}</span>
        </div>
        <div className="flex items-center justify-between pt-3">
          <span className="text-[13px] text-zinc-300">Confidence</span>
          <span className="font-mono text-[11px] font-semibold text-zinc-300">{Math.round(confidence * 100)}%</span>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-snug text-zinc-400">
        {reasoning}
      </p>
    </section>
  )
}
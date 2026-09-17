interface MonthlyRecord {
  month: string
  income: number
  expenses: number
  loan_repayment: number
}

interface CashFlowChartProps {
  monthlyHistory: MonthlyRecord[]
}

const GRID_STEPS = 4

function formatMonthLabel(month: string) {
  // "2026-01" -> "JAN"
  const [, monthNum] = month.split("-")
  const date = new Date(2000, Number(monthNum) - 1, 1)
  return date.toLocaleString("en-US", { month: "short" }).toUpperCase()
}

export function CashFlowChart({ monthlyHistory }: CashFlowChartProps) {
  const maxValue = Math.max(...monthlyHistory.flatMap((d) => [d.income, d.expenses]), 1)
  // Round max up to a clean step for gridlines
  const max = Math.ceil(maxValue / 1000 / 10) * 10 || 10
  const gridStep = max / GRID_STEPS
  const grid = Array.from({ length: GRID_STEPS + 1 }, (_, i) => i * gridStep)

  return (
    <section className="rounded-xl border border-white/8 bg-[#131316] p-5">
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          Cash Flow · {monthlyHistory.length} Mo
        </h2>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            <span className="h-2 w-2 rounded-sm bg-emerald-400" />
            Income
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            <span className="h-2 w-2 rounded-sm border border-zinc-600 bg-white/[0.04]" />
            Expenses
          </span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        {/* Y axis */}
        <div className="flex flex-col justify-between py-0.5 text-right">
          {[...grid].reverse().map((g) => (
            <span key={g} className="font-mono text-[10px] leading-none tabular-nums text-zinc-600">
              {g}k
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative flex-1">
          {/* Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {grid.map((g) => (
              <div key={g} className="border-t border-dashed border-white/8" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex h-44 items-end justify-between gap-3">
            {monthlyHistory.map((d) => (
              <div key={d.month} className="flex h-full flex-1 items-end justify-center gap-1">
                <div
                  className="w-full max-w-4 rounded-t-sm bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400/30"
                  style={{ height: `${(d.income / 1000 / max) * 100}%` }}
                  title={`Income ${Math.round(d.income / 1000)}k`}
                />
                <div
                  className="w-full max-w-4 rounded-t-sm border border-zinc-600 bg-white/[0.04]"
                  style={{ height: `${(d.expenses / 1000 / max) * 100}%` }}
                  title={`Expenses ${Math.round(d.expenses / 1000)}k`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X axis */}
      <div className="ml-9 mt-2 flex justify-between border-t border-white/8 pt-2">
        {monthlyHistory.map((d) => (
          <span key={d.month} className="flex-1 text-center font-mono text-[10px] tracking-wider text-zinc-500">
            {formatMonthLabel(d.month)}
          </span>
        ))}
      </div>
    </section>
  )
}
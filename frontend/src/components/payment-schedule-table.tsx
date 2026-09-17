type PaymentStatus = "pending" | "paid" | "deferred" | "added" | "overdue"

interface PaymentScheduleItem {
  due_date: string
  amount: number
  status: PaymentStatus
}

interface PaymentScheduleTableProps {
  adjustedSchedule: PaymentScheduleItem[]
  reasonForAdjustment?: string
  updatedBy?: string
}

const STATUS_TONE: Record<PaymentStatus, { dot: string; text: string; label: string }> = {
  pending: { dot: "bg-sky-400 shadow-[0_0_6px] shadow-sky-400/60", text: "text-sky-400", label: "PENDING" },
  paid: { dot: "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/60", text: "text-emerald-400", label: "PAID" },
  deferred: { dot: "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/60", text: "text-amber-400", label: "DEFERRED" },
  added: { dot: "bg-violet-400 shadow-[0_0_6px] shadow-violet-400/60", text: "text-violet-400", label: "ADDED" },
  overdue: { dot: "bg-rose-500 shadow-[0_0_6px] shadow-rose-500/60", text: "text-rose-400", label: "OVERDUE" },
}

function StatusIndicator({ status }: { status: PaymentStatus }) {
  const tone = STATUS_TONE[status]
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${tone.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  )
}

export function PaymentScheduleTable({ adjustedSchedule, reasonForAdjustment, updatedBy }: PaymentScheduleTableProps) {
  return (
    <section className="rounded-xl border border-white/8 bg-[#131316]">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Payment Schedule</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          {adjustedSchedule.length} Records
        </span>
      </div>

      {reasonForAdjustment && (
        <div className="border-b border-white/8 bg-amber-400/[0.06] px-5 py-2.5">
          <p className="text-[12px] leading-snug text-amber-300">
            {reasonForAdjustment}
            {updatedBy && <span className="text-zinc-500"> · updated by {updatedBy}</span>}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/8">
              {["Due Date", "Amount", "Status"].map((h) => (
                <th
                  key={h}
                  className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 ${
                    h === "Amount" ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {adjustedSchedule.map((row, i) => (
              <tr key={`${row.due_date}-${i}`} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-5 py-3 font-mono text-[12px] tabular-nums text-zinc-400">{row.due_date}</td>
                <td className="px-5 py-3 text-right font-mono text-[12px] font-semibold tabular-nums text-zinc-100">
                  ₹{row.amount.toLocaleString("en-IN")}
                </td>
                <td className="px-5 py-3">
                  <StatusIndicator status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
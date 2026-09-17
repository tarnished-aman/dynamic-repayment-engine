import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatINR, humanize } from "@/lib/format";
import type { PaymentPlan, PaymentScheduleItem } from "@/types";

type PaymentPlanTableProps = {
  data: PaymentPlan;
};

export function PaymentPlanTable({ data }: PaymentPlanTableProps) {
  return (
    <article className="rounded-2xl bg-paper-raised p-5 shadow-card ring-1 ring-ink/5">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
          Payment plan
        </p>
        <h2 className="mt-1 font-serif text-xl text-ink">Original vs adjusted schedule</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {data.reason_for_adjustment} Updated by {humanize(data.updated_by)} on{" "}
          {formatDate(data.updated_at)}.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <ScheduleTable title="Original" rows={data.original_schedule} />
        <ScheduleTable title="Adjusted" rows={data.adjusted_schedule} />
      </div>
    </article>
  );
}

function ScheduleTable({
  title,
  rows,
}: {
  title: string;
  rows: PaymentScheduleItem[];
}) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-ink/5">
      <div className="bg-paper px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Due</th>
            <th className="px-3 py-2 font-medium">Amount</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${title}-${row.due_date}-${row.status}`} className="border-t border-ink/5">
              <td className="px-3 py-2 text-ink">{formatDate(row.due_date)}</td>
              <td className="px-3 py-2 font-medium text-ink">{formatINR(row.amount)}</td>
              <td className="px-3 py-2">
                <StatusBadge value={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

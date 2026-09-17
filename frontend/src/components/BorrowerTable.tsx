"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { humanize } from "@/lib/format";
import type { BorrowerSummary } from "@/types";

type BorrowerTableProps = {
  borrowers: BorrowerSummary[];
  selectedId?: string;
  onSelect?: (borrowerId: string) => void;
};

export function BorrowerTable({
  borrowers,
  selectedId,
  onSelect,
}: BorrowerTableProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-paper-raised shadow-card ring-1 ring-ink/5">
      <header className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
          Portfolio
        </p>
        <h2 className="mt-1 font-serif text-xl text-ink">Borrowers</h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-y border-ink/5 bg-paper text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-5 py-2 font-medium">Borrower</th>
              <th className="px-3 py-2 font-medium">Trust</th>
              <th className="px-3 py-2 font-medium">Current flag</th>
              <th className="px-3 py-2 font-medium">Upcoming</th>
              <th className="px-5 py-2 font-medium">Hardship</th>
            </tr>
          </thead>
          <tbody>
            {borrowers.map((borrower) => {
              const selected = borrower.borrower_id === selectedId;
              return (
                <tr
                  key={borrower.borrower_id}
                  className={`border-b border-ink/5 ${selected ? "bg-teal-soft/60" : ""} ${
                    onSelect ? "cursor-pointer hover:bg-paper" : ""
                  }`}
                  onClick={() => onSelect?.(borrower.borrower_id)}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{borrower.name}</p>
                    <p className="text-xs text-ink-muted">
                      {borrower.borrower_id}
                      {borrower.category ? ` · ${humanize(borrower.category)}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-serif text-lg text-ink">
                    {borrower.trust_score}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge value={borrower.current_flag} />
                  </td>
                  <td className="px-3 py-3">
                    {borrower.upcoming_flag ? (
                      <StatusBadge
                        value={borrower.upcoming_flag}
                        label={`${humanize(borrower.upcoming_flag)}${
                          borrower.upcoming_flag_month
                            ? ` · ${borrower.upcoming_flag_month}`
                            : ""
                        }`}
                      />
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge value={borrower.hardship_classification} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

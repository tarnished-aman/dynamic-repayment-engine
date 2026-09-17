"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR, formatMonth } from "@/lib/format";
import type { MonthlyHistory } from "@/types";

type CashFlowChartProps = {
  monthlyHistory: MonthlyHistory[];
  title?: string;
};

export function CashFlowChart({
  monthlyHistory,
  title = "Cash-flow history",
}: CashFlowChartProps) {
  const data = monthlyHistory.map((row) => ({
    ...row,
    label: formatMonth(row.month),
  }));

  return (
    <article className="rounded-2xl bg-paper-raised p-5 shadow-card ring-1 ring-ink/5">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            12-month window
          </p>
          <h2 className="mt-1 font-serif text-xl text-ink">{title}</h2>
        </div>
        <ul className="flex gap-4 text-xs text-ink-muted">
          <li className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-teal" /> Income
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-clay" /> Expenses
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gold" /> Repayment
          </li>
        </ul>
      </header>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} barGap={2}>
            <CartesianGrid stroke="#e7e1d6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#5c6570", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
              tick={{ fill: "#5c6570", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              formatter={(value, name) => [
                formatINR(Number(value)),
                String(name),
              ]}
              contentStyle={{
                background: "#fbf8f2",
                border: "1px solid rgba(27,36,48,0.08)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="#0f5f56"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#c45c26"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
            <Line
              type="monotone"
              dataKey="loan_repayment"
              name="Repayment"
              stroke="#b0892a"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#b0892a" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

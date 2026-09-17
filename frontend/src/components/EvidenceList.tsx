import { StatusBadge } from "@/components/StatusBadge";
import { formatPercent, humanize } from "@/lib/format";
import type { EvidenceItem } from "@/types";

type EvidenceListProps = {
  items: EvidenceItem[];
  title?: string;
};

export function EvidenceList({ items, title = "Evidence" }: EvidenceListProps) {
  return (
    <section className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
        {title}
      </h3>
      <ol className="mt-2 space-y-2">
        {items.map((item, index) => {
          if (typeof item === "string") {
            return (
              <li
                key={`${item}-${index}`}
                className="rounded-xl bg-paper px-3 py-2 text-sm leading-6 text-ink"
              >
                <span className="mr-2 font-serif text-ink-muted">{index + 1}.</span>
                {item}
              </li>
            );
          }

          return (
            <li
              key={`${item.factor}-${index}`}
              className="flex items-start justify-between gap-3 rounded-xl bg-paper px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-ink">{humanize(item.factor)}</p>
                <p className="text-sm text-ink-muted">{item.details}</p>
              </div>
              <StatusBadge value={item.impact} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

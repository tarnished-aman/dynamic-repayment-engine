import type { CSSProperties } from "react";
import { humanize } from "@/lib/format";

const TONE_STYLES: Record<string, string> = {
  success: "bg-teal-soft text-teal ring-teal/15",
  warning: "bg-gold-soft text-ink ring-gold/25",
  danger: "bg-clay-soft text-clay ring-clay/20",
  info: "bg-paper text-ink-muted ring-ink/10",
  neutral: "bg-white text-ink-muted ring-ink/10",
};

const VALUE_TONES: Record<string, keyof typeof TONE_STYLES> = {
  high_trust: "success",
  medium_trust: "warning",
  low_trust: "danger",
  healthy: "success",
  temporary_stress: "warning",
  persistent_deterioration: "danger",
  temporary: "warning",
  persistent: "danger",
  undetermined: "info",
  normal: "success",
  lean_season: "warning",
  festival_slow: "info",
  paid: "success",
  pending: "neutral",
  deferred: "warning",
  added: "info",
  overdue: "danger",
  improving: "success",
  stable: "info",
  declining: "danger",
  auto_relief: "success",
  escalated: "danger",
  none: "neutral",
  high: "danger",
  medium: "warning",
  low: "info",
};

type StatusBadgeProps = {
  value: string;
  label?: string;
  className?: string;
};

export function StatusBadge({ value, label, className = "" }: StatusBadgeProps) {
  const tone = VALUE_TONES[value] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${TONE_STYLES[tone]} ${className}`}
      style={{ fontVariant: "small-caps" } as CSSProperties}
    >
      {label ?? humanize(value)}
    </span>
  );
}

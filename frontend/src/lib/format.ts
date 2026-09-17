export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, fromDecimal = false): string {
  const pct = fromDecimal ? value * 100 : value;
  const sign = pct > 0 && !fromDecimal ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";

  const date = iso.includes("T") ? new Date(iso) : new Date(`${iso}T00:00:00`);
  
  if (isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(new Date(year, month - 1, 1));
}

export function humanize(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).replace(/_/g, " ");
}

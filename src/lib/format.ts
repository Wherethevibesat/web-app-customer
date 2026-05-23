export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatEventTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventDateTime(start: string, end?: string | null) {
  const startStr = `${formatEventDate(start)} · ${formatEventTime(start)}`;
  if (!end) return startStr;
  return `${startStr} – ${formatEventTime(end)}`;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

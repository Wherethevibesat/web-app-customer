/** Houston events are stored as UTC instants; always display in Central Time. */
const EVENT_TIME_ZONE = "America/Chicago";

export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: EVENT_TIME_ZONE,
  });
}

export function formatEventTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_TIME_ZONE,
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

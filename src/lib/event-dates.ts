/** ISO calendar date `YYYY-MM-DD` in local timezone. */
export type EventDateIso = `${number}-${string}-${string}`;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toLocalIsoDate(date: Date): EventDateIso {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function eventStartsOnLocalDate(startsAt: string, isoDate: EventDateIso): boolean {
  return toLocalIsoDate(new Date(startsAt)) === isoDate;
}

export function parseEventDates(value: string | string[] | undefined): EventDateIso[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value.join(",") : value;
  const dates = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is EventDateIso => ISO_DATE_RE.test(part));
  return dates.length > 0 ? dates : undefined;
}

/** Single date filter; accepts comma-separated URLs for back-compat. */
export function parseEventDate(value: string | string[] | undefined): EventDateIso | undefined {
  return parseEventDates(value)?.[0];
}

export function formatEventDateLabel(isoDate: EventDateIso): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

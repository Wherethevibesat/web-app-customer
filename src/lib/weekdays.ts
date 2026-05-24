/** ISO weekday ids — sync with lib/data/weekdays.dart (1 = Monday … 7 = Sunday). */
export const WEEKDAYS = [
  { id: 1, label: "Monday", shortLabel: "Mon" },
  { id: 2, label: "Tuesday", shortLabel: "Tue" },
  { id: 3, label: "Wednesday", shortLabel: "Wed" },
  { id: 4, label: "Thursday", shortLabel: "Thu" },
  { id: 5, label: "Friday", shortLabel: "Fri" },
  { id: 6, label: "Saturday", shortLabel: "Sat" },
  { id: 7, label: "Sunday", shortLabel: "Sun" },
] as const;

export type DayOfWeek = (typeof WEEKDAYS)[number]["id"];

export function isoWeekday(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export function weekdayShortLabel(id: number): string {
  return WEEKDAYS.find((w) => w.id === id)?.shortLabel ?? "Day";
}

export function parseDayOfWeek(value: string | undefined): DayOfWeek | undefined {
  if (!value?.trim()) return undefined;
  const n = Number.parseInt(value, 10);
  if (n >= 1 && n <= 7) return n as DayOfWeek;
  return undefined;
}

export function parseDaysOfWeek(
  value: string | string[] | undefined,
): DayOfWeek[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value.join(",") : value;
  const days = raw
    .split(",")
    .map((part) => parseDayOfWeek(part.trim()))
    .filter((day): day is DayOfWeek => day != null);
  return days.length > 0 ? days : undefined;
}

export function toggleDayOfWeek(
  selected: DayOfWeek[] | undefined,
  day: DayOfWeek,
): DayOfWeek[] | undefined {
  const current = selected ?? [];
  const next = current.includes(day)
    ? current.filter((value) => value !== day)
    : [...current, day].sort((a, b) => a - b);
  return next.length > 0 ? next : undefined;
}

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type VenueDayHours = {
  closed: boolean;
  open: string | null;
  close: string | null;
};

export type VenueOpeningHours = Record<Weekday, VenueDayHours>;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function formatTime12h(time: string): string {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw ?? 0);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return m > 0 ? `${hour12}:${String(m).padStart(2, "0")} ${period}` : `${hour12} ${period}`;
}

export function openingHoursRows(hours: VenueOpeningHours | null | undefined) {
  if (!hours) return [];
  return WEEKDAYS.map((day) => {
    const slot = hours[day];
    if (!slot || slot.closed) {
      return { day: WEEKDAY_LABELS[day], label: "Closed" };
    }
    if (!slot.open || !slot.close) {
      return { day: WEEKDAY_LABELS[day], label: "Hours not set" };
    }
    return {
      day: WEEKDAY_LABELS[day],
      label: `${formatTime12h(slot.open)} – ${formatTime12h(slot.close)}`,
    };
  });
}

/** Canonical event types — keep in sync with admin `src/lib/types/event.ts`. */
export const EVENT_TYPES = [
  "Day Party",
  "Night Party",
  "After Hours",
  "Brunch / Daytime",
  "Happy Hours",
  "Live Music / DJ",
  "Hookah Vibes",
  "25 and Over",
  "30 and Over",
  "Upscale",
  "Private Event",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const DEFAULT_EVENT_TYPE: EventType = "Night Party";

export function eventTypeToSlug(type: string): string {
  return type
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function eventTypeFromSlug(slug: string | undefined): string | undefined {
  if (!slug?.trim()) return undefined;
  const target = slug.trim().toLowerCase();
  return EVENT_TYPES.find((t) => eventTypeToSlug(t) === target);
}

/** Types to show as chips: canonical list plus any legacy values still in the database. */
export function mergeEventTypes(fromDb: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of EVENT_TYPES) {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  for (const t of fromDb.sort()) {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

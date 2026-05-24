import { eventTypeFromSlug, eventTypeToSlug } from "@/lib/event-types";
import { parseEventDate, type EventDateIso } from "@/lib/event-dates";
import { parseDaysOfWeek, type DayOfWeek } from "@/lib/weekdays";

export type BrowseFilters = {
  type?: string;
  neighborhoods?: string[];
  featured?: boolean;
  q?: string;
  days?: DayOfWeek[];
  date?: EventDateIso;
};

function parseCsvParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildBrowseUrl(basePath: string, filters: BrowseFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.type) params.set("type", eventTypeToSlug(filters.type));
  if (filters.neighborhoods?.length) {
    params.set("neighborhood", filters.neighborhoods.join(","));
  }
  if (filters.featured) params.set("featured", "1");
  if (filters.days?.length) params.set("day", filters.days.join(","));
  if (filters.date) params.set("date", filters.date);

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function parseBrowseFilters(searchParams: {
  type?: string;
  neighborhood?: string | string[];
  featured?: string;
  q?: string;
  day?: string | string[];
  date?: string | string[];
}): BrowseFilters {
  const typeSlug = searchParams.type?.trim();
  const q = searchParams.q?.trim();
  const neighborhoods = parseCsvParam(searchParams.neighborhood);

  return {
    type: typeSlug ? (eventTypeFromSlug(typeSlug) ?? typeSlug) : undefined,
    neighborhoods: neighborhoods.length > 0 ? neighborhoods : undefined,
    featured: searchParams.featured === "1",
    q: q || undefined,
    days: parseDaysOfWeek(searchParams.day),
    date: parseEventDate(searchParams.date),
  };
}

export function toggleNeighborhoodSlug(
  selected: string[] | undefined,
  slug: string,
): string[] | undefined {
  const current = selected ?? [];
  const next = current.includes(slug)
    ? current.filter((value) => value !== slug)
    : [...current, slug];
  return next.length > 0 ? next : undefined;
}

/** Modal filters only — date is picked inline next to the Filters button. */
export function activeFilterCount(filters: BrowseFilters): number {
  return (
    (filters.type ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.days?.length ?? 0) +
    (filters.neighborhoods?.length ?? 0)
  );
}

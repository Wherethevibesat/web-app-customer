import type { Event, EventVenue } from "@/lib/data/events";
import { EVENT_SELECT, venueFromJoin } from "@/lib/data/events";
import { activeEventsOrFilter, eventIsActive } from "@/lib/event-visibility";
import type { DayOfWeek } from "@/lib/weekdays";
import { weekdayShortLabel } from "@/lib/weekdays";
import { createClient } from "@/lib/supabase/server";

export type EventRecurrence = {
  freq: "weekly";
  intervalWeeks: number;
  weekdays: DayOfWeek[];
  untilDate: string;
};

export type EventSeriesBrowse = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  neighborhood: string | null;
  image_url: string | null;
  featured: boolean;
  venue?: EventVenue | null;
  recurrence: EventRecurrence;
  nextOccurrence: Event;
};

const SERIES_SELECT =
  "id, title, description, event_type, neighborhood, image_url, venue:venues(id, name, image_url, neighborhood, venue_type)";

function venueFromSeriesJoin(
  venue: EventVenue | EventVenue[] | null | undefined,
): EventVenue | null {
  if (!venue) return null;
  return Array.isArray(venue) ? venue[0] ?? null : venue;
}

export function formatRecurringSchedule(recurrence: EventRecurrence): string {
  const days = recurrence.weekdays.map((id) => weekdayShortLabel(id));
  if (days.length === 0) return "Recurring";
  if (days.length === 1) return `Every ${days[0]}`;
  if (days.length === 2) return `Every ${days[0]} & ${days[1]}`;
  return `Every ${days.slice(0, -1).join(", ")} & ${days[days.length - 1]}`;
}

function parseWeekdays(raw: number[] | null | undefined): DayOfWeek[] {
  if (!raw?.length) return [];
  return raw.filter((n): n is DayOfWeek => n >= 1 && n <= 7);
}

function seriesIsActive(recurrence: EventRecurrence, now = new Date()): boolean {
  const until = new Date(`${recurrence.untilDate}T23:59:59`);
  return until.getTime() >= now.getTime();
}

type SeriesRow = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  neighborhood: string | null;
  image_url: string | null;
  venue: EventVenue | EventVenue[] | null;
};

type RecurrenceRow = {
  series_id: string;
  freq: string;
  interval_weeks: number;
  by_weekday: number[];
  until_date: string;
};

export async function listPublishedEventSeries(options?: {
  eventType?: string;
  neighborhoods?: string[];
  venueId?: string;
  featuredOnly?: boolean;
}): Promise<EventSeriesBrowse[]> {
  const supabase = await createClient();

  const { data: seriesRows, error: seriesError } = await supabase
    .from("event_series")
    .select(SERIES_SELECT)
    .eq("status", "published");
  if (seriesError || !seriesRows?.length) return [];

  const seriesIds = seriesRows.map((row) => row.id as string);

  const { data: recurrenceRows, error: recurrenceError } = await supabase
    .from("event_recurrence_rules")
    .select("series_id, freq, interval_weeks, by_weekday, until_date")
    .in("series_id", seriesIds);
  if (recurrenceError) return [];

  const recurrenceBySeries = new Map<string, EventRecurrence>();
  for (const row of recurrenceRows as RecurrenceRow[]) {
    recurrenceBySeries.set(row.series_id, {
      freq: "weekly",
      intervalWeeks: row.interval_weeks,
      weekdays: parseWeekdays(row.by_weekday),
      untilDate: row.until_date,
    });
  }

  let eventsQuery = supabase
    .from("events")
    .select(`${EVENT_SELECT}, series_id`)
    .eq("status", "published")
    .not("series_id", "is", null)
    .or(activeEventsOrFilter())
    .order("starts_at", { ascending: true });

  if (options?.eventType) {
    eventsQuery = eventsQuery.eq("event_type", options.eventType);
  }
  if (options?.neighborhoods?.length === 1) {
    eventsQuery = eventsQuery.eq("neighborhood", options.neighborhoods[0]);
  } else if (options?.neighborhoods && options.neighborhoods.length > 1) {
    eventsQuery = eventsQuery.in("neighborhood", options.neighborhoods);
  }
  if (options?.venueId) {
    eventsQuery = eventsQuery.eq("venue_id", options.venueId);
  }

  const { data: eventRows, error: eventsError } = await eventsQuery;
  if (eventsError) return [];

  const nextBySeries = new Map<string, Event>();
  const featuredBySeries = new Map<string, boolean>();

  for (const row of eventRows ?? []) {
    const seriesId = row.series_id as string | null;
    if (!seriesId) continue;
    const event = {
      ...row,
      venue: venueFromJoin(row.venue as EventVenue | EventVenue[] | null),
    } as Event;
    if (!eventIsActive(event)) continue;

    if (!nextBySeries.has(seriesId)) {
      nextBySeries.set(seriesId, event);
    }
    if (event.featured) {
      featuredBySeries.set(seriesId, true);
    }
  }

  const results: EventSeriesBrowse[] = [];

  for (const row of seriesRows as SeriesRow[]) {
    const recurrence = recurrenceBySeries.get(row.id);
    const nextOccurrence = nextBySeries.get(row.id);
    if (!recurrence || !nextOccurrence || !seriesIsActive(recurrence)) continue;

    const featured = featuredBySeries.get(row.id) ?? nextOccurrence.featured ?? false;
    if (options?.featuredOnly && !featured) continue;

    if (options?.eventType && row.event_type !== options.eventType) continue;

    const neighborhood = row.neighborhood ?? nextOccurrence.neighborhood;
    if (options?.neighborhoods?.length) {
      const targets = options.neighborhoods.map((n) => n.toLowerCase());
      if (!targets.includes((neighborhood ?? "").toLowerCase())) continue;
    }

    if (options?.venueId && nextOccurrence.venue_id !== options.venueId) continue;

    results.push({
      id: row.id,
      title: row.title,
      description: row.description,
      event_type: row.event_type,
      neighborhood,
      image_url: row.image_url ?? nextOccurrence.image_url,
      featured,
      venue: venueFromSeriesJoin(row.venue) ?? nextOccurrence.venue,
      recurrence,
      nextOccurrence,
    });
  }

  return results.sort(
    (a, b) =>
      new Date(a.nextOccurrence.starts_at).getTime() -
      new Date(b.nextOccurrence.starts_at).getTime(),
  );
}

export async function getEventSeries(id: string): Promise<{
  series: EventSeriesBrowse;
  upcoming: Event[];
} | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("event_series")
    .select(SERIES_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error || !row) return null;

  const { data: recurrenceRow } = await supabase
    .from("event_recurrence_rules")
    .select("series_id, freq, interval_weeks, by_weekday, until_date")
    .eq("series_id", id)
    .maybeSingle();
  if (!recurrenceRow) return null;

  const recurrence: EventRecurrence = {
    freq: "weekly",
    intervalWeeks: recurrenceRow.interval_weeks,
    weekdays: parseWeekdays(recurrenceRow.by_weekday),
    untilDate: recurrenceRow.until_date,
  };
  if (!seriesIsActive(recurrence)) return null;

  const { data: eventRows } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("series_id", id)
    .eq("status", "published")
    .or(activeEventsOrFilter())
    .order("starts_at", { ascending: true })
    .limit(16);

  const upcoming = (eventRows ?? [])
    .map((eventRow) => ({
      ...eventRow,
      venue: venueFromJoin(eventRow.venue as EventVenue | EventVenue[] | null),
    }))
    .filter((eventRow) => eventIsActive(eventRow as Event)) as Event[];

  if (upcoming.length === 0) return null;

  const nextOccurrence = upcoming[0];
  const featured = upcoming.some((e) => e.featured);

  const series: EventSeriesBrowse = {
    id: row.id,
    title: row.title,
    description: row.description,
    event_type: row.event_type,
    neighborhood: row.neighborhood ?? nextOccurrence.neighborhood,
    image_url: row.image_url ?? nextOccurrence.image_url,
    featured,
    venue: venueFromSeriesJoin(row.venue as EventVenue | EventVenue[] | null) ?? nextOccurrence.venue,
    recurrence,
    nextOccurrence,
  };

  return { series, upcoming };
}

export async function listOccurrencesForSeries(
  seriesId: string,
  limit = 16,
): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("series_id", seriesId)
    .eq("status", "published")
    .or(activeEventsOrFilter())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? [])
    .map((row) => ({
      ...row,
      venue: venueFromJoin(row.venue as EventVenue | EventVenue[] | null),
    }))
    .filter((row) => eventIsActive(row as Event)) as Event[];
}

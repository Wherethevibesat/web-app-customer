import type { Event } from "@/lib/data/events";
import { dedupeEventsBySeries, listPublishedEvents } from "@/lib/data/events";
import {
  formatRecurringSchedule,
  listPublishedEventSeries,
  type EventSeriesBrowse,
} from "@/lib/data/event-series";
import { eventStartsOnLocalDate, type EventDateIso } from "@/lib/event-dates";
import { isoWeekday, type DayOfWeek } from "@/lib/weekdays";

export type BrowseItem =
  | { kind: "event"; sortAt: string; event: Event }
  | { kind: "series"; sortAt: string; series: EventSeriesBrowse };

export async function listBrowseFeed(options?: {
  upcomingOnly?: boolean;
  featuredOnly?: boolean;
  homepageFeaturedOnly?: boolean;
  eventType?: string;
  neighborhoods?: string[];
  venueId?: string;
  limit?: number;
}): Promise<BrowseItem[]> {
  const homepageFeaturedOnly = Boolean(options?.homepageFeaturedOnly);
  const [oneOffs, series] = await Promise.all([
    listPublishedEvents({
      upcomingOnly: options?.upcomingOnly,
      featuredOnly: homepageFeaturedOnly ? undefined : options?.featuredOnly,
      homepageFeaturedOnly,
      eventType: options?.eventType,
      neighborhoods: options?.neighborhoods,
      limit: homepageFeaturedOnly ? (options?.limit ?? 3) * 8 : options?.limit,
      excludeSeries: homepageFeaturedOnly ? false : true,
    }),
    homepageFeaturedOnly
      ? Promise.resolve([])
      : listPublishedEventSeries({
          featuredOnly: options?.featuredOnly,
          eventType: options?.eventType,
          neighborhoods: options?.neighborhoods,
          venueId: options?.venueId,
        }),
  ]);

  const featuredEvents = homepageFeaturedOnly ? dedupeEventsBySeries(oneOffs) : oneOffs;
  const limitedEvents = options?.limit
    ? featuredEvents.slice(0, options.limit)
    : featuredEvents;

  const items: BrowseItem[] = [
    ...limitedEvents.map((event) => ({
      kind: "event" as const,
      sortAt: event.starts_at,
      event,
    })),
    ...series.map((s) => ({
      kind: "series" as const,
      sortAt: s.nextOccurrence.starts_at,
      series: s,
    })),
  ];

  items.sort((a, b) => new Date(a.sortAt).getTime() - new Date(b.sortAt).getTime());

  if (options?.limit && !homepageFeaturedOnly) {
    return items.slice(0, options.limit);
  }
  return items;
}

export function filterBrowseFeed(
  items: BrowseItem[],
  options?: {
    q?: string;
    eventType?: string;
    neighborhoods?: string[];
    days?: DayOfWeek[];
    date?: EventDateIso;
  },
): BrowseItem[] {
  let rows = items;

  if (options?.eventType) {
    rows = rows.filter((item) =>
      item.kind === "event"
        ? item.event.event_type === options.eventType
        : item.series.event_type === options.eventType,
    );
  }

  const neighborhoodFilters =
    options?.neighborhoods?.map((value) => value.toLowerCase()) ??
    undefined;
  if (neighborhoodFilters?.length) {
    rows = rows.filter((item) => {
      const neighborhood =
        item.kind === "event"
          ? item.event.neighborhood
          : item.series.neighborhood;
      return neighborhoodFilters.includes((neighborhood ?? "").toLowerCase());
    });
  }

  if (options?.days?.length) {
    const selected = new Set(options.days);
    rows = rows.filter((item) => {
      if (item.kind === "event") {
        return selected.has(isoWeekday(new Date(item.event.starts_at)) as DayOfWeek);
      }
      return item.series.recurrence.weekdays.some((day) => selected.has(day));
    });
  }

  if (options?.date) {
    rows = rows.filter((item) => {
      if (item.kind === "event") {
        return eventStartsOnLocalDate(item.event.starts_at, options.date!);
      }
      const onDay = item.series.recurrence.weekdays.some(
        (day) => day === (isoWeekday(new Date(`${options.date}T12:00:00`)) as DayOfWeek),
      );
      const nextOnDate = eventStartsOnLocalDate(
        item.series.nextOccurrence.starts_at,
        options.date!,
      );
      return onDay || nextOnDate;
    });
  }

  if (options?.q?.trim()) {
    const q = options.q.trim().toLowerCase();
    rows = rows.filter((item) => {
      if (item.kind === "event") {
        const e = item.event;
        return (
          e.title.toLowerCase().includes(q) ||
          e.event_type.toLowerCase().includes(q) ||
          (e.neighborhood ?? "").toLowerCase().includes(q) ||
          (e.venue?.name ?? "").toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q)
        );
      }
      const s = item.series;
      const schedule = formatRecurringSchedule(s.recurrence).toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.event_type.toLowerCase().includes(q) ||
        schedule.includes(q) ||
        (s.neighborhood ?? "").toLowerCase().includes(q) ||
        (s.venue?.name ?? "").toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
      );
    });
  }

  return rows;
}

export async function searchBrowseFeed(
  query: string,
  options?: {
    eventType?: string;
    neighborhood?: string;
    neighborhoods?: string[];
    days?: DayOfWeek[];
    date?: EventDateIso;
    limit?: number;
  },
): Promise<BrowseItem[]> {
  const neighborhoodFilters =
    options?.neighborhoods ??
    (options?.neighborhood ? [options.neighborhood] : undefined);

  const all = await listBrowseFeed({
    eventType: options?.eventType,
    neighborhoods: neighborhoodFilters,
  });

  return filterBrowseFeed(all, {
    q: query,
    eventType: options?.eventType,
    neighborhoods: neighborhoodFilters,
    days: options?.days,
    date: options?.date,
  }).slice(0, options?.limit ?? 40);
}

export function browseItemKey(item: BrowseItem): string {
  return item.kind === "event" ? `event-${item.event.id}` : `series-${item.series.id}`;
}

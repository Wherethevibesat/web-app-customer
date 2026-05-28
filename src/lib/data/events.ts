import { mergeEventTypes } from "@/lib/event-types";
import { activeEventsOrFilter, eventIsActive, pastEventsOrFilter } from "@/lib/event-visibility";
import { createClient } from "@/lib/supabase/server";
import { isoWeekday, type DayOfWeek } from "@/lib/weekdays";
import { eventStartsOnLocalDate, type EventDateIso } from "@/lib/event-dates";

export interface EventVenue {
  id: string;
  name: string;
  image_url?: string | null;
  neighborhood?: string | null;
  venue_type?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  neighborhood: string | null;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  featured: boolean | null;
  homepage_featured?: boolean;
  featured_starts_at?: string | null;
  featured_ends_at?: string | null;
  venue_id: string | null;
  series_id?: string | null;
  venue?: EventVenue | null;
}

export function venueFromJoin(
  venue: EventVenue | EventVenue[] | null,
): EventVenue | null {
  if (!venue) return null;
  return Array.isArray(venue) ? venue[0] ?? null : venue;
}

export const EVENT_SELECT =
  "id, title, description, event_type, neighborhood, starts_at, ends_at, image_url, featured, homepage_featured, featured_starts_at, featured_ends_at, venue_id, series_id, venue:venues(id, name, image_url, neighborhood, venue_type)";

export async function listPublishedEvents(options?: {
  upcomingOnly?: boolean;
  featuredOnly?: boolean;
  homepageFeaturedOnly?: boolean;
  eventType?: string;
  neighborhood?: string;
  neighborhoods?: string[];
  limit?: number;
  excludeSeries?: boolean;
}): Promise<Event[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (options?.excludeSeries) {
    query = query.is("series_id", null);
  }
  if (options?.upcomingOnly !== false) {
    query = query.or(activeEventsOrFilter());
  }
  if (options?.featuredOnly) {
    query = query.eq("featured", true);
  }
  if (options?.homepageFeaturedOnly) {
    query = query.eq("homepage_featured", true);
  }
  if (options?.eventType) {
    query = query.eq("event_type", options.eventType);
  }
  const neighborhoodFilters =
    options?.neighborhoods?.filter(Boolean) ??
    (options?.neighborhood ? [options.neighborhood] : undefined);
  if (neighborhoodFilters?.length === 1) {
    query = query.eq("neighborhood", neighborhoodFilters[0]);
  } else if (neighborhoodFilters && neighborhoodFilters.length > 1) {
    query = query.in("neighborhood", neighborhoodFilters);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    const fallback = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: true });
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []) as Event[];
  }

  return (data ?? [])
    .map((row) => ({
      ...row,
      venue: venueFromJoin(row.venue as EventVenue | EventVenue[] | null),
    }))
    .filter((row) =>
      options?.upcomingOnly === false ? true : eventIsActive(row as Event),
    )
    .filter((row) => {
      if (!options?.homepageFeaturedOnly) return true;
      const startsAt = row.featured_starts_at ? new Date(row.featured_starts_at).getTime() : null;
      const endsAt = row.featured_ends_at ? new Date(row.featured_ends_at).getTime() : null;
      const now = Date.now();
      if (startsAt && startsAt > now) return false;
      if (endsAt && endsAt < now) return false;
      return true;
    }) as Event[];
}

export async function listEventsByVenue(venueId: string): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("venue_id", venueId)
    .eq("status", "published")
    .or(activeEventsOrFilter())
    .order("starts_at", { ascending: true })
    .limit(12);
  if (error) return [];
  return (data ?? [])
    .map((row) => ({
      ...row,
      venue: venueFromJoin(row.venue as EventVenue | EventVenue[] | null),
    }))
    .filter((row) => eventIsActive(row as Event)) as Event[];
}

export async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    venue: venueFromJoin(data.venue as EventVenue | EventVenue[] | null),
  } as Event;
}

export async function getEventTypes(): Promise<string[]> {
  const { listBrowseFeed } = await import("@/lib/browse-events");
  const items = await listBrowseFeed({ limit: 200 });
  const fromDb = [
    ...new Set(
      items.map((item) =>
        item.kind === "event" ? item.event.event_type : item.series.event_type,
      ),
    ),
  ];
  return mergeEventTypes(fromDb);
}

export function filterEventsClient(
  events: Event[],
  options?: {
    q?: string;
    eventType?: string;
    neighborhood?: string;
    neighborhoods?: string[];
    days?: number[];
    date?: EventDateIso;
  },
): Event[] {
  let rows = events;
  if (options?.eventType) {
    rows = rows.filter((e) => e.event_type === options.eventType);
  }
  const neighborhoodFilters =
    options?.neighborhoods?.map((value) => value.toLowerCase()) ??
    (options?.neighborhood ? [options.neighborhood.toLowerCase()] : undefined);
  if (neighborhoodFilters?.length) {
    rows = rows.filter((e) =>
      neighborhoodFilters.includes((e.neighborhood ?? "").toLowerCase()),
    );
  }
  if (options?.days?.length) {
    const selected = new Set(options.days);
    rows = rows.filter((e) => selected.has(isoWeekday(new Date(e.starts_at))));
  }
  if (options?.date) {
    rows = rows.filter((e) => eventStartsOnLocalDate(e.starts_at, options.date!));
  }
  if (options?.q?.trim()) {
    const q = options.q.trim().toLowerCase();
    rows = rows.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q) ||
        (e.neighborhood ?? "").toLowerCase().includes(q) ||
        (e.venue?.name ?? "").toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q),
    );
  }
  return rows;
}

export async function searchEvents(
  query: string,
  options?: {
    eventType?: string;
    neighborhood?: string;
    neighborhoods?: string[];
    days?: DayOfWeek[];
    date?: EventDateIso;
    limit?: number;
  },
): Promise<Event[]> {
  const { searchBrowseFeed } = await import("@/lib/browse-events");
  const items = await searchBrowseFeed(query, options);
  return items.map((item) =>
    item.kind === "event" ? item.event : item.series.nextOccurrence,
  );
}

export interface VipPackage {
  id: string;
  package_name: string;
  description: string | null;
  price: number;
  benefits: unknown;
  image_url: string | null;
}

export async function listEventVipPackages(eventId: string): Promise<VipPackage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vip_packages")
    .select("id, package_name, description, price, benefits, image_url")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("price");
  if (error) return [];
  return (data ?? []) as VipPackage[];
}

export async function listPastEventsByVenue(venueId: string, limit = 6): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("venue_id", venueId)
    .eq("status", "published")
    .or(pastEventsOrFilter())
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => ({
    ...row,
    venue: venueFromJoin(row.venue as EventVenue | EventVenue[] | null),
  })) as Event[];
}

export type VenueVipPackage = VipPackage & {
  event_id: string;
  event_title: string;
};

export async function listVenueVipPackages(venueId: string): Promise<VenueVipPackage[]> {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("venue_id", venueId)
    .eq("status", "published")
    .or(activeEventsOrFilter());

  if (!events?.length) return [];

  const eventTitles = new Map(events.map((event) => [event.id as string, event.title as string]));
  const eventIds = events.map((event) => event.id as string);

  const { data, error } = await supabase
    .from("vip_packages")
    .select("id, package_name, description, price, benefits, image_url, event_id")
    .in("event_id", eventIds)
    .eq("is_active", true)
    .order("price");

  if (error) return [];

  return (data ?? [])
    .map((row) => {
      const eventId = row.event_id as string;
      const eventTitle = eventTitles.get(eventId);
      if (!eventTitle) return null;
      return {
        id: row.id as string,
        package_name: row.package_name as string,
        description: (row.description as string | null) ?? null,
        price: Number(row.price),
        benefits: row.benefits,
        image_url: (row.image_url as string | null) ?? null,
        event_id: eventId,
        event_title: eventTitle,
      };
    })
    .filter((pkg): pkg is VenueVipPackage => pkg !== null);
}

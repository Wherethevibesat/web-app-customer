import { mergeEventTypes } from "@/lib/event-types";
import { createClient } from "@/lib/supabase/server";

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
  venue_id: string | null;
  venue?: EventVenue | null;
}

function venueFromJoin(
  venue: EventVenue | EventVenue[] | null,
): EventVenue | null {
  if (!venue) return null;
  return Array.isArray(venue) ? venue[0] ?? null : venue;
}

const EVENT_SELECT =
  "id, title, description, event_type, neighborhood, starts_at, ends_at, image_url, featured, venue_id, venue:venues(id, name, image_url, neighborhood, venue_type)";

export async function listPublishedEvents(options?: {
  upcomingOnly?: boolean;
  featuredOnly?: boolean;
  eventType?: string;
  neighborhood?: string;
  limit?: number;
}): Promise<Event[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (options?.upcomingOnly !== false) {
    query = query.gte("starts_at", new Date().toISOString());
  }
  if (options?.featuredOnly) {
    query = query.eq("featured", true);
  }
  if (options?.eventType) {
    query = query.eq("event_type", options.eventType);
  }
  if (options?.neighborhood) {
    query = query.eq("neighborhood", options.neighborhood);
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

  return (data ?? []).map((row) => ({
    ...row,
    venue: venueFromJoin(row.venue as EventVenue | EventVenue[] | null),
  })) as Event[];
}

export async function listEventsByVenue(venueId: string): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("venue_id", venueId)
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(12);
  if (error) return [];
  return (data ?? []).map((row) => ({
    ...row,
    venue: venueFromJoin(row.venue as EventVenue | EventVenue[] | null),
  })) as Event[];
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
  const events = await listPublishedEvents({ upcomingOnly: false, limit: 200 });
  const fromDb = [...new Set(events.map((e) => e.event_type))];
  return mergeEventTypes(fromDb);
}

export function filterEventsClient(
  events: Event[],
  options?: { q?: string; eventType?: string; neighborhood?: string },
): Event[] {
  let rows = events;
  if (options?.eventType) {
    rows = rows.filter((e) => e.event_type === options.eventType);
  }
  if (options?.neighborhood) {
    const target = options.neighborhood.toLowerCase();
    rows = rows.filter((e) => (e.neighborhood ?? "").toLowerCase() === target);
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
  options?: { eventType?: string; neighborhood?: string; limit?: number },
): Promise<Event[]> {
  const all = await listPublishedEvents({
    upcomingOnly: true,
    eventType: options?.eventType,
    neighborhood: options?.neighborhood,
    limit: 200,
  });
  return filterEventsClient(all, {
    q: query,
    eventType: options?.eventType,
    neighborhood: options?.neighborhood,
  }).slice(0, options?.limit ?? 40);
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

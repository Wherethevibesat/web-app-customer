import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/promoter-slug";

export interface PromoterOfferPublic {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  capacity: number;
  allow_pay: boolean;
  allow_inquire: boolean;
  slots_used: number;
  promoter_id: string;
  promoter?: {
    user_id: string;
    display_name: string;
    bio: string;
    slug?: string | null;
  } | null;
}

export interface PromoterProfilePublic {
  user_id: string;
  display_name: string;
  bio: string;
  contact_phone: string | null;
  profile_image_url: string | null;
  slug: string | null;
}

export type PromoterEventPublic = {
  id: string;
  title: string;
  starts_at: string;
  venue_id: string;
  venue_name: string | null;
};

function eventIsCustomerVisible(event: {
  status: string;
  promoter_event_approval: string;
}) {
  if (event.status !== "published") return false;
  return (
    event.promoter_event_approval === "not_applicable" ||
    event.promoter_event_approval === "approved"
  );
}

export async function listOffersForEvent(eventId: string): Promise<PromoterOfferPublic[]> {
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, status, promoter_event_approval")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || !eventIsCustomerVisible(event)) return [];

  const { data: offers, error } = await supabase
    .from("promoter_offers")
    .select(
      "id, name, description, price_cents, capacity, allow_pay, allow_inquire, promoter_id, promoter:users!promoter_offers_promoter_id_fkey(id, name)",
    )
    .eq("event_id", eventId)
    .eq("is_active", true);

  if (error) return [];

  const withSlots = await Promise.all(
    (offers ?? []).map(async (o) => {
      const row = o as Record<string, unknown>;
      const slots = await countSlotsUsed(row.id as string);
      const user = Array.isArray(row.promoter) ? row.promoter[0] : row.promoter;
      const userRow = user as { id: string; name: string } | null;
      return {
        id: row.id as string,
        name: row.name as string,
        description: (row.description as string) ?? "",
        price_cents: row.price_cents as number,
        capacity: row.capacity as number,
        allow_pay: row.allow_pay as boolean,
        allow_inquire: row.allow_inquire as boolean,
        slots_used: slots,
        promoter_id: row.promoter_id as string,
        promoter: userRow
          ? {
              user_id: userRow.id,
              display_name: userRow.name,
              bio: "",
            }
          : null,
      };
    }),
  );

  return withSlots.filter((o) => o.slots_used < o.capacity);
}

async function countSlotsUsed(offerId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("promoter_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId)
    .in("status", ["reserved", "booked"]);
  return count ?? 0;
}

export async function getPromoterProfile(userId: string): Promise<PromoterProfilePublic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promoter_profiles")
    .select(
      "user_id, display_name, bio, contact_phone, profile_image_url, slug",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as PromoterProfilePublic;
}

export async function resolvePromoterProfile(
  slugOrId: string,
): Promise<PromoterProfilePublic | null> {
  if (isUuid(slugOrId)) {
    return getPromoterProfile(slugOrId);
  }

  const admin = createAdminClient();
  const normalized = slugOrId.toLowerCase().trim();
  const { data } = await admin
    .from("promoter_profiles")
    .select(
      "user_id, display_name, bio, contact_phone, profile_image_url, slug",
    )
    .eq("slug", normalized)
    .maybeSingle();

  return (data as PromoterProfilePublic | null) ?? null;
}

export async function listEventsForPromoterPublic(
  promoterId: string,
): Promise<PromoterEventPublic[]> {
  const admin = createAdminClient();
  const { data: offers } = await admin
    .from("promoter_offers")
    .select("event_id, event:events(id, title, starts_at, venue_id, status, promoter_event_approval, venue:venues(name))")
    .eq("promoter_id", promoterId)
    .eq("is_active", true);

  const { data: createdEvents } = await admin
    .from("events")
    .select("id, title, starts_at, venue_id, status, promoter_event_approval, venue:venues(name)")
    .eq("created_by_promoter_id", promoterId)
    .eq("status", "published");

  const map = new Map<string, PromoterEventPublic>();

  for (const raw of createdEvents ?? []) {
    const row = raw as Record<string, unknown>;
    if (!eventIsCustomerVisible(row as { status: string; promoter_event_approval: string })) {
      continue;
    }
    const venue = Array.isArray(row.venue) ? row.venue[0] : row.venue;
    map.set(row.id as string, {
      id: row.id as string,
      title: row.title as string,
      starts_at: row.starts_at as string,
      venue_id: row.venue_id as string,
      venue_name: (venue as { name: string } | null)?.name ?? null,
    });
  }

  for (const raw of offers ?? []) {
    const row = raw as Record<string, unknown>;
    const event = Array.isArray(row.event) ? row.event[0] : row.event;
    if (!event || !eventIsCustomerVisible(event as { status: string; promoter_event_approval: string })) {
      continue;
    }
    const ev = event as Record<string, unknown>;
    const venue = Array.isArray(ev.venue) ? ev.venue[0] : ev.venue;
    map.set(ev.id as string, {
      id: ev.id as string,
      title: ev.title as string,
      starts_at: ev.starts_at as string,
      venue_id: ev.venue_id as string,
      venue_name: (venue as { name: string } | null)?.name ?? null,
    });
  }

  return [...map.values()].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
}

export type PromoterVenuePublic = {
  id: string;
  name: string;
  neighborhood: string | null;
};

export type PromoterBrowseRow = {
  user_id: string;
  display_name: string;
  bio: string;
  profile_image_url: string | null;
  slug: string | null;
  venues: PromoterVenuePublic[];
  offer_count: number;
};

export async function listVenuesForPromoter(promoterId: string): Promise<PromoterVenuePublic[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("promoter_venue_links")
    .select("venue:venues(id, name, neighborhood, published)")
    .eq("promoter_id", promoterId)
    .eq("status", "approved");

  const venues: PromoterVenuePublic[] = [];
  for (const row of data ?? []) {
    const venue = Array.isArray(row.venue) ? row.venue[0] : row.venue;
    if (!venue || !(venue as { published?: boolean }).published) continue;
    venues.push({
      id: (venue as { id: string }).id,
      name: (venue as { name: string }).name,
      neighborhood: (venue as { neighborhood: string | null }).neighborhood ?? null,
    });
  }
  return venues.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listOffersByPromoter(promoterId: string): Promise<PromoterOfferPublic[]> {
  const supabase = await createClient();
  const { data: offers } = await supabase
    .from("promoter_offers")
    .select(
      "id, name, description, price_cents, capacity, allow_pay, allow_inquire, promoter_id, event_id, event:events(status, promoter_event_approval, starts_at)",
    )
    .eq("promoter_id", promoterId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const visible: PromoterOfferPublic[] = [];
  for (const raw of offers ?? []) {
    const row = raw as Record<string, unknown>;
    const event = Array.isArray(row.event) ? row.event[0] : row.event;
    if (!event || !eventIsCustomerVisible(event as { status: string; promoter_event_approval: string })) {
      continue;
    }
    const slots = await countSlotsUsed(row.id as string);
    if (slots >= (row.capacity as number)) continue;
    visible.push({
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) ?? "",
      price_cents: row.price_cents as number,
      capacity: row.capacity as number,
      allow_pay: row.allow_pay as boolean,
      allow_inquire: row.allow_inquire as boolean,
      slots_used: slots,
      promoter_id: promoterId,
    });
  }
  return visible;
}

export async function listPromotersForBrowse(search?: string): Promise<PromoterBrowseRow[]> {
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("promoter_profiles")
    .select("user_id, display_name, bio, profile_image_url, slug")
    .order("display_name");

  const { data: links } = await admin
    .from("promoter_venue_links")
    .select("promoter_id, venue:venues(id, name, neighborhood, published)")
    .eq("status", "approved");

  const { data: offers } = await admin
    .from("promoter_offers")
    .select("id, promoter_id, capacity, event:events(status, promoter_event_approval)")
    .eq("is_active", true);

  const venueMap = new Map<string, PromoterVenuePublic[]>();
  for (const link of links ?? []) {
    const promoterId = link.promoter_id as string;
    const venue = Array.isArray(link.venue) ? link.venue[0] : link.venue;
    if (!venue || !(venue as { published?: boolean }).published) continue;
    const list = venueMap.get(promoterId) ?? [];
    list.push({
      id: (venue as { id: string }).id,
      name: (venue as { name: string }).name,
      neighborhood: (venue as { neighborhood: string | null }).neighborhood ?? null,
    });
    venueMap.set(promoterId, list);
  }

  const offerCountMap = new Map<string, number>();
  for (const raw of offers ?? []) {
    const row = raw as Record<string, unknown>;
    const event = Array.isArray(row.event) ? row.event[0] : row.event;
    if (!event || !eventIsCustomerVisible(event as { status: string; promoter_event_approval: string })) {
      continue;
    }
    const offerId = row.id as string;
    const slots = await countSlotsUsed(offerId);
    if (slots >= (row.capacity as number)) continue;
    const pid = row.promoter_id as string;
    offerCountMap.set(pid, (offerCountMap.get(pid) ?? 0) + 1);
  }

  let rows: PromoterBrowseRow[] = (profiles ?? [])
    .map((p) => {
      const venues = (venueMap.get(p.user_id as string) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      return {
        user_id: p.user_id as string,
        display_name: (p.display_name as string) || "Promoter",
        bio: (p.bio as string) ?? "",
        profile_image_url: (p.profile_image_url as string | null) ?? null,
        slug: (p.slug as string | null) ?? null,
        venues,
        offer_count: offerCountMap.get(p.user_id as string) ?? 0,
      };
    })
    .filter((p) => p.venues.length > 0 || p.offer_count > 0);

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.venues.some(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            (v.neighborhood ?? "").toLowerCase().includes(q),
        ),
    );
  }

  return rows;
}

export async function getOfferForInquiry(offerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("promoter_offers")
    .select("id, event_id, promoter_id, name, price_cents, capacity, allow_inquire, is_active")
    .eq("id", offerId)
    .eq("is_active", true)
    .maybeSingle();
  if (!data?.allow_inquire) return null;

  const slots = await countSlotsUsed(offerId);
  if (slots >= data.capacity) return null;

  const { data: event } = await supabase
    .from("events")
    .select("status, promoter_event_approval")
    .eq("id", data.event_id)
    .maybeSingle();

  if (!event || !eventIsCustomerVisible(event)) return null;
  return data;
}

export async function getPromoterForProfileInquiry(promoterId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("promoter_profiles")
    .select("user_id, display_name")
    .eq("user_id", promoterId)
    .maybeSingle();
  return data;
}

export type VenuePromoterOffer = PromoterOfferPublic & {
  event_id: string;
  event_title: string;
};

export async function listPromotersForVenue(
  venueId: string,
): Promise<PromoterProfilePublic[]> {
  const admin = createAdminClient();
  const { data: links } = await admin
    .from("promoter_venue_links")
    .select("promoter_id")
    .eq("venue_id", venueId)
    .eq("status", "approved");

  const promoterIds = [...new Set((links ?? []).map((l) => l.promoter_id as string))];
  if (!promoterIds.length) return [];

  const { data: profiles } = await admin
    .from("promoter_profiles")
    .select(
      "user_id, display_name, bio, contact_phone, profile_image_url, slug",
    )
    .in("user_id", promoterIds);

  return ((profiles ?? []) as PromoterProfilePublic[]).sort((a, b) =>
    a.display_name.localeCompare(b.display_name),
  );
}

export async function listOffersForVenue(venueId: string): Promise<VenuePromoterOffer[]> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, status, promoter_event_approval")
    .eq("venue_id", venueId)
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString());

  const visibleEvents = (events ?? []).filter((event) =>
    eventIsCustomerVisible(event as { status: string; promoter_event_approval: string }),
  );
  if (!visibleEvents.length) return [];

  const eventTitles = new Map(
    visibleEvents.map((event) => [event.id as string, event.title as string]),
  );
  const eventIds = visibleEvents.map((event) => event.id as string);

  const { data: offers } = await supabase
    .from("promoter_offers")
    .select(
      "id, name, description, price_cents, capacity, allow_pay, allow_inquire, promoter_id, event_id",
    )
    .in("event_id", eventIds)
    .eq("is_active", true);

  if (!offers?.length) return [];

  const promoterIds = [...new Set(offers.map((o) => o.promoter_id as string))];
  const { data: profiles } = await admin
    .from("promoter_profiles")
    .select("user_id, display_name, bio, slug")
    .in("user_id", promoterIds);
  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id as string,
      p as { user_id: string; display_name: string; bio: string; slug: string | null },
    ]),
  );

  const results: VenuePromoterOffer[] = [];
  for (const raw of offers) {
    const row = raw as Record<string, unknown>;
    const eventId = row.event_id as string;
    const eventTitle = eventTitles.get(eventId);
    if (!eventTitle) continue;

    const slots = await countSlotsUsed(row.id as string);
    if (slots >= (row.capacity as number)) continue;

    const profile = profileMap.get(row.promoter_id as string);
    results.push({
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) ?? "",
      price_cents: row.price_cents as number,
      capacity: row.capacity as number,
      allow_pay: row.allow_pay as boolean,
      allow_inquire: row.allow_inquire as boolean,
      slots_used: slots,
      promoter_id: row.promoter_id as string,
      event_id: eventId,
      event_title: eventTitle,
      promoter: profile
        ? {
            user_id: profile.user_id,
            display_name: profile.display_name,
            bio: profile.bio ?? "",
            slug: profile.slug,
          }
        : null,
    });
  }

  return results.sort((a, b) => a.price_cents - b.price_cents);
}

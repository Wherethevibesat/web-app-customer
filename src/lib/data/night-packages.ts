import { createClient } from "@/lib/supabase/server";
import type { ApprovedStopOffer } from "@/lib/data/night-packages-shared";

export type { ApprovedStopOffer } from "@/lib/data/night-packages-shared";
export { slotTypeLabel } from "@/lib/data/night-packages-shared";

export type NightPackageStop = {
  id: string;
  sort_order: number;
  scheduled_label: string | null;
  notes: string;
  stop_offer: {
    id: string;
    title: string;
    description: string;
    slot_type: string;
    price_cents: number;
    inclusions: string[];
    arrival_window: string | null;
    image_url: string | null;
    why_picked?: string;
    duration_label?: string | null;
    dress_code?: string | null;
    crowd_label?: string | null;
    venue: { id: string; name: string } | null;
  } | null;
};

export type NightPackage = {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string;
  description: string;
  tagline: string;
  why_this_works: string;
  perfect_for: string[];
  not_ideal_for: string[];
  diy_compare_cents: number | null;
  rating: number | null;
  groups_booked: number | null;
  vibe_tags: string[];
  energy_score: number | null;
  travel_minutes: number | null;
  crowd_label: string | null;
  music_tags: string[];
  template_key: string | null;
  city: string;
  image_url: string | null;
  starts_on: string | null;
  party_size_min: number;
  party_size_max: number;
  is_featured: boolean;
  stops?: NightPackageStop[];
  subtotal_cents?: number;
};

const OFFER_FIELDS = `
  id, title, description, slot_type, price_cents, inclusions,
  arrival_window, image_url, status, is_active,
  why_picked, duration_label, dress_code, crowd_label,
  venue:venues(id, name)
`;

const STOP_SELECT = `
  id, sort_order, scheduled_label, notes, stop_offer_id,
  stop_offer:package_stop_offers(${OFFER_FIELDS})
`;

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
}

function normalizeStops(raw: unknown): NightPackageStop[] {
  const stops = (Array.isArray(raw) ? raw : []) as NightPackageStop[];
  return stops
    .filter((s) => {
      const offer = s.stop_offer as NightPackageStop["stop_offer"] & {
        status?: string;
        is_active?: boolean;
      };
      if (!offer) return false;
      if (offer.status && offer.status !== "approved") return false;
      if (offer.is_active === false) return false;
      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

function normalizePackage(row: Record<string, unknown>): NightPackage {
  const stops = normalizeStops(row.stops);
  const subtotal_cents = stops.reduce(
    (sum, s) => sum + (s.stop_offer?.price_cents ?? 0),
    0,
  );
  return {
    id: row.id as string,
    slug: (row.slug as string | null) ?? null,
    title: row.title as string,
    subtitle: (row.subtitle as string) ?? "",
    description: (row.description as string) ?? "",
    tagline: (row.tagline as string) ?? "",
    why_this_works: (row.why_this_works as string) ?? "",
    perfect_for: asStringArray(row.perfect_for),
    not_ideal_for: asStringArray(row.not_ideal_for),
    diy_compare_cents:
      row.diy_compare_cents == null ? null : Number(row.diy_compare_cents),
    rating: row.rating == null ? null : Number(row.rating),
    groups_booked: row.groups_booked == null ? null : Number(row.groups_booked),
    vibe_tags: asStringArray(row.vibe_tags),
    energy_score: row.energy_score == null ? null : Number(row.energy_score),
    travel_minutes:
      row.travel_minutes == null ? null : Number(row.travel_minutes),
    crowd_label: (row.crowd_label as string | null) ?? null,
    music_tags: asStringArray(row.music_tags),
    template_key: (row.template_key as string | null) ?? null,
    city: (row.city as string) ?? "houston",
    image_url: (row.image_url as string | null) ?? null,
    starts_on: (row.starts_on as string | null) ?? null,
    party_size_min: Number(row.party_size_min ?? 1),
    party_size_max: Number(row.party_size_max ?? 8),
    is_featured: Boolean(row.is_featured),
    stops,
    subtotal_cents,
  };
}

export async function listPublishedNightPackages(): Promise<NightPackage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("night_packages")
    .select(`*, stops:night_package_stops(${STOP_SELECT})`)
    .eq("status", "published")
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => normalizePackage(row as Record<string, unknown>));
}

export async function getPublishedNightPackage(
  idOrSlug: string,
): Promise<NightPackage | null> {
  const supabase = await createClient();
  let query = supabase
    .from("night_packages")
    .select(`*, stops:night_package_stops(${STOP_SELECT})`)
    .eq("status", "published");

  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug,
    );
  query = looksLikeUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return normalizePackage(data as Record<string, unknown>);
}

/** Public catalog of venue stops guests can swap/add into a plan. */
export async function listApprovedStopOffers(options?: {
  slotType?: string;
  excludeIds?: string[];
}): Promise<ApprovedStopOffer[]> {
  const supabase = await createClient();
  let query = supabase
    .from("package_stop_offers")
    .select(
      `
      id, title, description, slot_type, price_cents, inclusions,
      arrival_window, image_url, why_picked, duration_label, dress_code, crowd_label,
      venue:venues(id, name)
    `,
    )
    .eq("status", "approved")
    .eq("is_active", true)
    .order("slot_type")
    .order("title");

  if (options?.slotType) {
    query = query.eq("slot_type", options.slotType);
  }

  const { data, error } = await query;
  if (error) throw error;

  const exclude = new Set(options?.excludeIds ?? []);
  return (data ?? [])
    .map((row) => {
      const venueRaw = row.venue as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      const venue = Array.isArray(venueRaw) ? venueRaw[0] ?? null : venueRaw;
      return {
        id: row.id as string,
        title: row.title as string,
        description: (row.description as string) ?? "",
        slot_type: row.slot_type as string,
        price_cents: Number(row.price_cents),
        inclusions: (row.inclusions as string[]) ?? [],
        arrival_window: (row.arrival_window as string | null) ?? null,
        image_url: (row.image_url as string | null) ?? null,
        why_picked: (row.why_picked as string) ?? "",
        duration_label: (row.duration_label as string | null) ?? null,
        dress_code: (row.dress_code as string | null) ?? null,
        crowd_label: (row.crowd_label as string | null) ?? null,
        venue,
      } satisfies ApprovedStopOffer;
    })
    .filter((s) => !exclude.has(s.id));
}

import { createClient } from "@/lib/supabase/server";
import type { VenueOpeningHours } from "@/lib/types/opening-hours";

export interface Venue {
  id: string;
  name: string;
  venue_type: string;
  address: string | null;
  image_url: string | null;
  description: string | null;
  rating: number | null;
  neighborhood: string | null;
  check_in_count: number | null;
  is_open: boolean | null;
  hours_label: string | null;
  opening_hours: VenueOpeningHours | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  featured: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
}

const VENUE_SELECT =
  "id, name, venue_type, address, image_url, description, rating, neighborhood, check_in_count, is_open, hours_label, opening_hours, website_url, instagram_url, facebook_url, tiktok_url, twitter_url, featured, latitude, longitude";

export async function listVenues(options?: {
  search?: string;
  neighborhood?: string;
}): Promise<Venue[]> {
  const search = options?.search;
  const neighborhood = options?.neighborhood;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(`${VENUE_SELECT}, listing_expires_at`)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("name");

  if (error) {
    const fallback = await supabase.from("venues").select("*").eq("published", true).order("name");
    if (fallback.error) throw fallback.error;
    let rows = (fallback.data ?? []) as (Venue & { listing_expires_at?: string | null })[];
    const now = Date.now();
    rows = rows.filter(
      (v) => !v.listing_expires_at || new Date(v.listing_expires_at).getTime() > now,
    );
    if (neighborhood?.trim()) {
      const target = neighborhood.trim().toLowerCase();
      rows = rows.filter((v) => (v.neighborhood ?? "").toLowerCase() === target);
    }
    if (search?.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.neighborhood ?? "").toLowerCase().includes(q),
      );
    }
    return rows;
  }

  let rows = (data ?? []) as (Venue & { listing_expires_at?: string | null })[];
  const now = Date.now();
  rows = rows.filter(
    (v) => !v.listing_expires_at || new Date(v.listing_expires_at).getTime() > now,
  );

  if (neighborhood?.trim()) {
    const target = neighborhood.trim().toLowerCase();
    rows = rows.filter((v) => (v.neighborhood ?? "").toLowerCase() === target);
  }
  if (search?.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.neighborhood ?? "").toLowerCase().includes(q),
    );
  }
  return rows;
}

export async function getVenue(id: string): Promise<Venue | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as Venue & { listing_expires_at?: string | null };
  if (
    row.listing_expires_at &&
    new Date(row.listing_expires_at).getTime() <= Date.now()
  ) {
    return null;
  }
  return row;
}

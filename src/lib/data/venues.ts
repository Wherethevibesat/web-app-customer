import { createClient } from "@/lib/supabase/server";

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
  featured: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
}

const VENUE_SELECT =
  "id, name, venue_type, address, image_url, description, rating, neighborhood, check_in_count, is_open, hours_label, featured, latitude, longitude";

export async function listVenues(search?: string): Promise<Venue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_SELECT)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("name");

  if (error) {
    const fallback = await supabase.from("venues").select("*").order("name");
    if (fallback.error) throw fallback.error;
    let rows = (fallback.data ?? []) as Venue[];
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

  let rows = (data ?? []) as Venue[];
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
    .maybeSingle();
  if (error) throw error;
  return data as Venue | null;
}

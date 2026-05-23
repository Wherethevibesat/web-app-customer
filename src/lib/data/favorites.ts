import { createClient } from "@/lib/supabase/server";
import type { Venue } from "@/lib/data/venues";

export async function listFavorites(userId: string): Promise<Venue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_favorites")
    .select(
      "venue:venues(id, name, venue_type, address, image_url, description, rating, neighborhood, check_in_count, is_open, hours_label, featured, latitude, longitude)",
    )
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? [])
    .map((r) => {
      const v = r.venue as Venue | Venue[] | null;
      if (!v) return null;
      return Array.isArray(v) ? v[0] : v;
    })
    .filter((v): v is Venue => Boolean(v?.id));
}

export async function toggleFavorite(userId: string, venueId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("user_favorites")
    .select("venue_id")
    .eq("user_id", userId)
    .eq("venue_id", venueId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("venue_id", venueId);
    return false;
  }

  await supabase.from("user_favorites").insert({ user_id: userId, venue_id: venueId });
  return true;
}

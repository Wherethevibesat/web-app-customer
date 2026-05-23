import { createClient } from "@/lib/supabase/server";
import { CHECK_IN_POINTS } from "@/lib/ranking-rules";

export async function createCheckIn(userId: string, venueId: string, caption?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .insert({
      user_id: userId,
      venue_id: venueId,
      caption: caption ?? null,
      points_awarded: CHECK_IN_POINTS,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { data: rank } = await supabase
    .from("user_rankings")
    .select("total_points")
    .eq("user_id", userId)
    .maybeSingle();

  const newPoints = (rank?.total_points ?? 0) + CHECK_IN_POINTS;
  await supabase.from("user_rankings").upsert({
    user_id: userId,
    total_points: newPoints,
    updated_at: new Date().toISOString(),
  });

  return { checkInId: data.id as string, pointsAwarded: CHECK_IN_POINTS, totalPoints: newPoints };
}

export type CheckInRow = {
  id: string;
  caption: string | null;
  points_awarded: number;
  started_at: string;
  venueName: string;
};

function venueNameFromJoin(venue: { name: string } | { name: string }[] | null): string {
  if (!venue) return "Venue";
  const v = Array.isArray(venue) ? venue[0] : venue;
  return v?.name ?? "Venue";
}

export async function listMyCheckIns(userId: string): Promise<CheckInRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .select("id, caption, points_awarded, started_at, venue:venues(name)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id as string,
    caption: c.caption as string | null,
    points_awarded: c.points_awarded as number,
    started_at: c.started_at as string,
    venueName: venueNameFromJoin(c.venue as { name: string } | { name: string }[] | null),
  }));
}

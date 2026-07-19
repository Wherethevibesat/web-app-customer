import { createClient } from "@/lib/supabase/server";

export type CheckInResult = {
  checkInId: string;
  basePoints: number;
  pointsAwarded: number;
  totalPoints: number;
  firstVisit: boolean;
  firstVisitBonus: number;
  streak: boolean;
  streakBonus: number;
};

export async function createCheckIn(
  venueId: string,
  caption?: string,
  coords?: { lat: number; lng: number } | null,
): Promise<CheckInResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_in_venue", {
    p_venue_id: venueId,
    p_caption: caption?.trim() ? caption.trim() : null,
    p_lat: coords?.lat ?? null,
    p_lng: coords?.lng ?? null,
  });
  if (error) throw new Error(error.message || "Check-in failed");

  const r = (data ?? {}) as Record<string, unknown>;
  return {
    checkInId: String(r.check_in_id ?? ""),
    basePoints: Number(r.base_points ?? 0),
    pointsAwarded: Number(r.points_awarded ?? 0),
    totalPoints: Number(r.total_points ?? 0),
    firstVisit: Boolean(r.first_visit),
    firstVisitBonus: Number(r.first_visit_bonus ?? 0),
    streak: Boolean(r.streak),
    streakBonus: Number(r.streak_bonus ?? 0),
  };
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

export type PointsLedgerRow = {
  id: string;
  source: string;
  points: number;
  venueName: string | null;
  created_at: string;
};

const SOURCE_LABELS: Record<string, string> = {
  check_in: "Check-in",
  first_visit: "First visit bonus",
  streak: "Daily streak",
  event_attend: "Event attendance",
  referral: "Referral",
  review: "Review",
  redeem: "Reward redemption",
  adjustment: "Adjustment",
};

export function pointsSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export async function listMyPointsLedger(userId: string): Promise<PointsLedgerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("points_events")
    .select("id, source, points, created_at, venue:venues(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    source: row.source as string,
    points: row.points as number,
    venueName: venueNameFromJoin(row.venue as { name: string } | { name: string }[] | null),
    created_at: row.created_at as string,
  }));
}

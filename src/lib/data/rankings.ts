import { createClient } from "@/lib/supabase/server";
import { tierForPoints } from "@/lib/ranking-rules";

type RankedUser = { id: string; name: string; profile_image_url: string | null };

function userFromJoin(user: RankedUser | RankedUser[] | null): RankedUser | null {
  if (!user) return null;
  return Array.isArray(user) ? user[0] ?? null : user;
}

export async function getMyRanking(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_rankings")
    .select("total_points")
    .eq("user_id", userId)
    .maybeSingle();
  const points = data?.total_points ?? 0;
  return { points, tier: tierForPoints(points) };
}

export async function getLeaderboard(limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_rankings")
    .select("total_points, user:users(id, name, profile_image_url)")
    .order("total_points", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? [])
    .map((row) => {
      const user = userFromJoin(row.user as RankedUser | RankedUser[] | null);
      if (!user) return null;
      return {
        points: row.total_points as number,
        user,
        tier: tierForPoints(row.total_points as number),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

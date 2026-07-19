import { createClient } from "@/lib/supabase/server";

export type Reward = {
  id: string;
  title: string;
  description: string | null;
  reward_type: string;
  cost_points: number;
  image_url: string | null;
  terms: string | null;
  stock: number | null;
  redeemed_count: number;
  venueName: string | null;
};

export type Redemption = {
  id: string;
  code: string;
  status: string;
  cost_points: number;
  created_at: string;
  expires_at: string | null;
  rewardTitle: string;
  venueName: string | null;
};

function nameFromJoin(rel: { name: string } | { name: string }[] | null): string | null {
  if (!rel) return null;
  const r = Array.isArray(rel) ? rel[0] : rel;
  return r?.name ?? null;
}

export async function listRewards(): Promise<Reward[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rewards")
    .select(
      "id, title, description, reward_type, cost_points, image_url, terms, stock, redeemed_count, venue:venues(name)",
    )
    .eq("active", true)
    .order("cost_points", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: r.description as string | null,
    reward_type: r.reward_type as string,
    cost_points: r.cost_points as number,
    image_url: r.image_url as string | null,
    terms: r.terms as string | null,
    stock: r.stock as number | null,
    redeemed_count: r.redeemed_count as number,
    venueName: nameFromJoin(r.venue as { name: string } | { name: string }[] | null),
  }));
}

export async function listMyRedemptions(userId: string): Promise<Redemption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select(
      "id, code, status, cost_points, created_at, expires_at, reward:rewards(title), venue:venues(name)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    status: r.status as string,
    cost_points: r.cost_points as number,
    created_at: r.created_at as string,
    expires_at: r.expires_at as string | null,
    rewardTitle: nameFromJoin(r.reward as { name: string } | { name: string }[] | null) ?? "Reward",
    venueName: nameFromJoin(r.venue as { name: string } | { name: string }[] | null),
  }));
}

export type RedeemResult = {
  redemptionId: string;
  code: string;
  rewardTitle: string;
  costPoints: number;
  totalPoints: number;
};

export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId });
  if (error) throw new Error(error.message || "Redemption failed");
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    redemptionId: String(r.redemption_id ?? ""),
    code: String(r.code ?? ""),
    rewardTitle: String(r.reward_title ?? "Reward"),
    costPoints: Number(r.cost_points ?? 0),
    totalPoints: Number(r.total_points ?? 0),
  };
}

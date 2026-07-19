import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeemReward } from "@/lib/data/rewards";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { rewardId } = await request.json();
  if (!rewardId || typeof rewardId !== "string") {
    return NextResponse.json({ error: "Reward is required" }, { status: 400 });
  }

  try {
    const result = await redeemReward(rewardId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Redemption failed" },
      { status: 400 },
    );
  }
}

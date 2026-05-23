import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckIn } from "@/lib/data/check-ins";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { venueId, caption } = await request.json();
  try {
    const result = await createCheckIn(user.id, venueId, caption);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

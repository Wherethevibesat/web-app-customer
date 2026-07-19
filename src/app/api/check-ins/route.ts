import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckIn } from "@/lib/data/check-ins";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { venueId, caption, lat, lng } = await request.json();
  if (!venueId || typeof venueId !== "string") {
    return NextResponse.json({ error: "Venue is required" }, { status: 400 });
  }

  const coords =
    typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;

  try {
    const result = await createCheckIn(venueId, caption, coords);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}

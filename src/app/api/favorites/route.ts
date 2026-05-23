import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toggleFavorite } from "@/lib/data/favorites";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { venueId } = await request.json();
  const favorited = await toggleFavorite(user.id, venueId);
  return NextResponse.json({ favorited });
}

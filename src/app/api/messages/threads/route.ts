import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findOrCreateDmThread,
  findOrCreateVenueThread,
  listMyThreads,
} from "@/lib/data/messages";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const threads = await listMyThreads(user.id);
    return NextResponse.json({ threads });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load threads";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json();
  const { otherUserId, venueId, venueName } = body as {
    otherUserId?: string;
    venueId?: string;
    venueName?: string;
  };

  try {
    if (otherUserId) {
      if (otherUserId === user.id) {
        return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
      }
      const threadId = await findOrCreateDmThread(user.id, otherUserId);
      return NextResponse.json({ threadId });
    }
    if (venueId) {
      const threadId = await findOrCreateVenueThread(
        user.id,
        venueId,
        venueName ?? "Venue",
      );
      return NextResponse.json({ threadId });
    }
    return NextResponse.json({ error: "otherUserId or venueId required" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create thread";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

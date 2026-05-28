import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ConciergeClickBody = {
  query?: string;
  sessionId?: string;
  recommendation?: {
    kind?: "event" | "venue";
    id?: string;
    title?: string;
    url?: string;
  };
};

export async function POST(request: Request) {
  let body: ConciergeClickBody;
  try {
    body = (await request.json()) as ConciergeClickBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rec = body.recommendation;
  if (!rec?.kind || !rec?.id) {
    return NextResponse.json({ error: "recommendation.kind and recommendation.id are required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const admin = createAdminClient();
    await admin.from("concierge_events").insert({
      event_type: "click",
      user_id: user?.id ?? null,
      session_id: body.sessionId ?? null,
      query: body.query?.trim() ?? null,
      recommendation_kind: rec.kind,
      recommendation_id: rec.id,
      recommendation_title: rec.title ?? null,
      payload: {
        url: rec.url ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record click";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

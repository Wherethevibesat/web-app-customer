import { NextResponse } from "next/server";
import { runConcierge, type ConciergeRequest } from "@/lib/ai/concierge";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: ConciergeRequest;
  try {
    body = (await request.json()) as ConciergeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const result = await runConcierge(body);
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const admin = createAdminClient();
      await admin.from("concierge_events").insert({
        event_type: "query",
        user_id: user?.id ?? null,
        session_id: body.sessionId ?? null,
        query: body.query.trim(),
        payload: {
          appliedFilters: result.appliedFilters,
          recommendations: result.recommendations.map((r) => ({
            kind: r.kind,
            id: r.id,
            title: r.title,
            url: r.url,
          })),
          debug: result.debug,
        },
      });
    } catch {
      // Never fail the customer response due to analytics write issues.
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Concierge failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

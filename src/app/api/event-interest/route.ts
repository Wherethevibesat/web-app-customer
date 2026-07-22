import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmailSafe } from "@/lib/email/send";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const NOTIFY_TO =
  process.env.EVENT_INTEREST_NOTIFY_EMAIL ||
  process.env.CITY_REQUESTS_NOTIFY_EMAIL ||
  "business@wherethevibesat.com";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    city?: string;
    neighborhood?: string;
    vibe?: string;
    note?: string;
    source?: string;
    eventId?: string;
    venueId?: string;
  };

  const email = body.email?.trim() ?? "";
  const name = body.name?.trim() || null;
  const city = body.city?.trim().slice(0, 120) || null;
  const neighborhood = body.neighborhood?.trim().slice(0, 120) || null;
  const vibe = body.vibe?.trim().slice(0, 80) || null;
  const note = body.note?.trim().slice(0, 2000) || null;
  const source =
    body.source === "notify_me" || body.source === "empty_feed" || body.source === "tip_a_night"
      ? body.source
      : "tip_a_night";
  const eventId = body.eventId?.trim() || null;
  const venueId = body.venueId?.trim() || null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  if (source === "tip_a_night" || source === "empty_feed") {
    if (!note && !vibe) {
      return NextResponse.json(
        { error: "Tell us a vibe or drop a quick note about the night" },
        { status: 400 },
      );
    }
  }

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("event_interest").insert({
    email,
    name,
    city,
    neighborhood,
    vibe,
    note,
    source,
    event_id: eventId,
    venue_id: venueId,
    user_id: userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const labels: Record<typeof source, string> = {
    notify_me: "Event notify-me",
    tip_a_night: "Tip a night",
    empty_feed: "Empty feed tip",
  };
  const label = labels[source];

  sendEmailSafe({
    to: NOTIFY_TO,
    subject: `${label}${vibe ? `: ${vibe}` : ""}${city ? ` (${city})` : ""}`,
    html: [
      `<h2>${escapeHtml(label)}</h2>`,
      `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`,
      name ? `<p><strong>Name:</strong> ${escapeHtml(name)}</p>` : "",
      city ? `<p><strong>City:</strong> ${escapeHtml(city)}</p>` : "",
      neighborhood ? `<p><strong>Neighborhood:</strong> ${escapeHtml(neighborhood)}</p>` : "",
      vibe ? `<p><strong>Vibe:</strong> ${escapeHtml(vibe)}</p>` : "",
      note ? `<p><strong>Note:</strong> ${escapeHtml(note)}</p>` : "",
      eventId ? `<p><strong>Event ID:</strong> ${escapeHtml(eventId)}</p>` : "",
      venueId ? `<p><strong>Venue ID:</strong> ${escapeHtml(venueId)}</p>` : "",
      `<p><strong>Source:</strong> ${escapeHtml(source)}</p>`,
    ].join(""),
    text: [
      label,
      `Email: ${email}`,
      name ? `Name: ${name}` : "",
      city ? `City: ${city}` : "",
      neighborhood ? `Neighborhood: ${neighborhood}` : "",
      vibe ? `Vibe: ${vibe}` : "",
      note ? `Note: ${note}` : "",
      eventId ? `Event ID: ${eventId}` : "",
      venueId ? `Venue ID: ${venueId}` : "",
      `Source: ${source}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return NextResponse.json({ ok: true });
}

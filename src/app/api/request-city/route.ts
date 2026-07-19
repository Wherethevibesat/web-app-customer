import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cityLabel, getCity } from "@/lib/cities";
import { sendEmailSafe } from "@/lib/email/send";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Where internal city-request notifications land. */
const NOTIFY_TO =
  process.env.CITY_REQUESTS_NOTIFY_EMAIL || "business@wherethevibesat.com";

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
    note?: string;
    source?: string;
  };

  const email = body.email?.trim() ?? "";
  const cityRaw = body.city?.trim() ?? "";
  const name = body.name?.trim() || null;
  const note = body.note?.trim() || null;
  const source = body.source === "coming_soon" ? "coming_soon" : "request_form";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!cityRaw) {
    return NextResponse.json({ error: "Please tell us which city" }, { status: 400 });
  }

  // Normalize a known slug/name to a consistent label.
  const known = getCity(cityRaw);
  const city = known ? cityLabel(known) : cityRaw.slice(0, 120);

  // Associate with the signed-in user when available (optional).
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
  const { error } = await admin.from("city_requests").insert({
    email,
    name,
    city,
    note,
    source,
    user_id: userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify the team (fire-and-forget; never blocks or fails the request).
  const label = source === "coming_soon" ? "Launch notify signup" : "City request";
  sendEmailSafe({
    to: NOTIFY_TO,
    subject: `${label}: ${city}`,
    html: [
      `<h2>${escapeHtml(label)}</h2>`,
      `<p><strong>City:</strong> ${escapeHtml(city)}</p>`,
      `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`,
      name ? `<p><strong>Name:</strong> ${escapeHtml(name)}</p>` : "",
      note ? `<p><strong>Note:</strong> ${escapeHtml(note)}</p>` : "",
      `<p><strong>Source:</strong> ${escapeHtml(source)}</p>`,
    ].join(""),
    text: [
      label,
      `City: ${city}`,
      `Email: ${email}`,
      name ? `Name: ${name}` : "",
      note ? `Note: ${note}` : "",
      `Source: ${source}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return NextResponse.json({ ok: true });
}

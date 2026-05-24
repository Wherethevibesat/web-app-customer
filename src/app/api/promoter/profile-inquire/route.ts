import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPromoterForProfileInquiry } from "@/lib/data/promoters";
import { requireUser } from "@/lib/auth/require-user";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  const body = await request.json();
  const {
    promoterId,
    guestName,
    guestEmail,
    guestPhone,
    partySize,
    preferredEvent,
    notes,
  } = body;

  if (!promoterId || !guestName?.trim() || !guestEmail?.trim()) {
    return NextResponse.json(
      { error: "promoterId, guestName, and guestEmail are required" },
      { status: 400 },
    );
  }

  const profile = await getPromoterForProfileInquiry(promoterId);
  if (!profile) {
    return NextResponse.json({ error: "Promoter not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("promoter_profile_inquiries").insert({
    promoter_id: promoterId,
    customer_id: user?.id ?? null,
    guest_name: guestName.trim(),
    guest_email: guestEmail.trim(),
    guest_phone: typeof guestPhone === "string" ? guestPhone.trim() : null,
    party_size: partySize != null ? Number(partySize) : null,
    preferred_event: typeof preferredEvent === "string" ? preferredEvent.trim() : "",
    notes: typeof notes === "string" ? notes.trim() : "",
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: promoterUser } = await admin
    .from("users")
    .select("name, email")
    .eq("id", promoterId)
    .maybeSingle();

  if (promoterUser?.email) {
    const { notifyPromoterProfileInquiry, notifyCustomerProfileInquiryReceived } = await import(
      "@/lib/email/promoter-notifications"
    );
    notifyPromoterProfileInquiry({
      promoterEmail: promoterUser.email,
      promoterName: promoterUser.name ?? profile.display_name,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: typeof guestPhone === "string" ? guestPhone.trim() : null,
      partySize: partySize != null ? Number(partySize) : null,
      preferredEvent: typeof preferredEvent === "string" ? preferredEvent.trim() : null,
      notes: typeof notes === "string" ? notes.trim() : null,
    });
    notifyCustomerProfileInquiryReceived({
      guestEmail: guestEmail.trim(),
      guestName: guestName.trim(),
      promoterName: profile.display_name || promoterUser.name || "Promoter",
    });
  }

  return NextResponse.json({ ok: true });
}

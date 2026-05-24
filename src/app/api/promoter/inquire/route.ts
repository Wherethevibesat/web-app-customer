import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOfferForInquiry } from "@/lib/data/promoters";
import { requireUser } from "@/lib/auth/require-user";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  const body = await request.json();
  const {
    offerId,
    guestName,
    guestEmail,
    guestPhone,
    partySize,
    arrivalTime,
    notes,
  } = body;

  if (!offerId || !guestName?.trim() || !guestEmail?.trim()) {
    return NextResponse.json(
      { error: "offerId, guestName, and guestEmail are required" },
      { status: 400 },
    );
  }

  const offer = await getOfferForInquiry(offerId);
  if (!offer) {
    return NextResponse.json({ error: "Offer not available" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("promoter_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId)
    .in("status", ["reserved", "booked"]);

  if ((count ?? 0) >= offer.capacity) {
    return NextResponse.json({ error: "This offer is sold out" }, { status: 400 });
  }

  const { error } = await admin.from("promoter_inquiries").insert({
    offer_id: offerId,
    promoter_id: offer.promoter_id,
    event_id: offer.event_id,
    customer_id: user?.id ?? null,
    guest_name: guestName.trim(),
    guest_email: guestEmail.trim(),
    guest_phone: typeof guestPhone === "string" ? guestPhone.trim() : null,
    party_size: partySize != null ? Number(partySize) : null,
    arrival_time: typeof arrivalTime === "string" ? arrivalTime.trim() : null,
    notes: typeof notes === "string" ? notes.trim() : "",
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: promoter } = await admin
    .from("users")
    .select("name, email")
    .eq("id", offer.promoter_id)
    .maybeSingle();
  const { data: eventRow } = await admin
    .from("events")
    .select("title")
    .eq("id", offer.event_id)
    .maybeSingle();

  if (promoter?.email) {
    const { notifyPromoterNewInquiry, notifyCustomerInquiryReceived } = await import(
      "@/lib/email/promoter-notifications"
    );
    notifyPromoterNewInquiry({
      promoterEmail: promoter.email,
      promoterName: promoter.name,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: typeof guestPhone === "string" ? guestPhone.trim() : null,
      partySize: partySize != null ? Number(partySize) : null,
      arrivalTime: typeof arrivalTime === "string" ? arrivalTime.trim() : null,
      notes: typeof notes === "string" ? notes.trim() : null,
      offerName: offer.name as string,
      offerPriceCents: offer.price_cents as number,
      eventTitle: (eventRow?.title as string) ?? "Event",
    });
    notifyCustomerInquiryReceived({
      guestEmail: guestEmail.trim(),
      guestName: guestName.trim(),
      offerName: offer.name as string,
      eventTitle: (eventRow?.title as string) ?? "Event",
    });
  }

  return NextResponse.json({ ok: true });
}

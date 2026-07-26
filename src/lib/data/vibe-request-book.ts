import { createAdminClient } from "@/lib/supabase/admin";
import {
  getNightPackageCommissionPct,
  getPublishedNightPackageForCheckout,
  resolveApprovedStopOffers,
  type NightPackageCheckoutStop,
} from "@/lib/stripe/server";
import {
  assertVibeVenuesConnectReady,
} from "@/lib/stripe/vibe-marketplace";
import {
  notifyGuestVibeAwaitingPayment,
  notifyGuestVibeRequestDeclined,
  notifyGuestVibeRequestExpired,
  notifyVenueVibeBookingRequest,
} from "@/lib/email/vibe-notifications";
import { sendFcmToUser } from "@/lib/push/fcm";
import { formatVibeStartLabel } from "@/lib/event-dates";
import { customerPortalUrl } from "@/lib/email/send";

export const VIBE_REQUEST_TTL_HOURS = 48;

export async function expireOverdueVibeRequests(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: expired } = await admin
    .from("night_package_orders")
    .select("id, user_id, guest_email, guest_name")
    .eq("status", "requested")
    .lt("expires_at", now);

  if (!expired?.length) return 0;

  for (const order of expired) {
    await admin
      .from("night_package_orders")
      .update({ status: "expired", updated_at: now })
      .eq("id", order.id)
      .eq("status", "requested");

    await admin
      .from("night_package_order_stops")
      .update({ status: "cancelled" })
      .eq("order_id", order.id)
      .eq("status", "pending_venue");

    const email = order.guest_email as string | null;
    if (email) {
      notifyGuestVibeRequestExpired({
        toEmail: email,
        guestName: (order.guest_name as string) || "there",
      });
    }
  }

  return expired.length;
}

export async function createVibeBookingRequest(params: {
  userId: string;
  packageId: string;
  partySize: number;
  startsOn: string;
  stopOfferIds: string[];
  guestName?: string | null;
  guestEmail?: string | null;
}): Promise<{ orderId: string; expiresAt: string; confirmationCode: string }> {
  await expireOverdueVibeRequests();

  const pkg = await getPublishedNightPackageForCheckout(params.packageId, {
    useAdmin: true,
  });
  if (!pkg) throw new Error("Package not found");

  if (
    params.partySize < pkg.party_size_min ||
    params.partySize > pkg.party_size_max
  ) {
    throw new Error(
      `Party size must be between ${pkg.party_size_min} and ${pkg.party_size_max}`,
    );
  }

  const stops =
    params.stopOfferIds.length > 0
      ? await resolveApprovedStopOffers(params.stopOfferIds, { useAdmin: true })
      : pkg.stops;

  if (!stops.length) throw new Error("Add at least one stop to your plan");
  if (
    params.stopOfferIds.length > 0 &&
    stops.length !== params.stopOfferIds.length
  ) {
    throw new Error("One or more selected stops are unavailable");
  }

  const connect = await assertVibeVenuesConnectReady(stops);
  if (connect.ok) {
    throw new Error(
      "All places are ready for instant checkout — pay now instead of requesting.",
    );
  }

  const unitSubtotal = stops.reduce((sum, s) => sum + s.price_cents, 0);
  if (unitSubtotal <= 0) throw new Error("Invalid package price");

  const commissionPct = await getNightPackageCommissionPct();
  const subtotalCents = unitSubtotal * params.partySize;
  const commissionCents = Math.round((subtotalCents * commissionPct) / 100);
  const totalCents = subtotalCents + commissionCents;

  const expiresAt = new Date(
    Date.now() + VIBE_REQUEST_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const now = new Date().toISOString();

  const admin = createAdminClient();

  // Prefer profile email/name when not provided
  let guestEmail = params.guestEmail ?? null;
  let guestName = params.guestName ?? null;
  if (!guestEmail || !guestName) {
    const { data: profile } = await admin
      .from("users")
      .select("email, name")
      .eq("id", params.userId)
      .maybeSingle();
    guestEmail = guestEmail || (profile?.email as string | null) || null;
    guestName = guestName || (profile?.name as string | null) || null;
  }

  const { data: order, error: orderError } = await admin
    .from("night_package_orders")
    .insert({
      package_id: params.packageId,
      user_id: params.userId,
      party_size: params.partySize,
      starts_on: params.startsOn,
      subtotal_cents: subtotalCents,
      commission_cents: commissionCents,
      total_cents: totalCents,
      status: "requested",
      expires_at: expiresAt,
      guest_name: guestName,
      guest_email: guestEmail,
      updated_at: now,
    })
    .select("id, confirmation_code")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Could not create booking request");
  }

  const stopRows = stops.map((stop: NightPackageCheckoutStop, index: number) => {
    const lineTotal = stop.price_cents * params.partySize;
    return {
      order_id: order.id,
      stop_offer_id: stop.stop_offer_id,
      venue_id: stop.venue_id,
      sort_order: stop.sort_order ?? index,
      title: stop.title,
      slot_type: stop.slot_type,
      unit_price_cents: stop.price_cents,
      party_size: params.partySize,
      line_total_cents: lineTotal,
      venue_payout_cents: lineTotal,
      scheduled_label: stop.scheduled_label,
      status: "pending_venue",
      payout_status: "pending",
    };
  });

  const { error: stopsError } = await admin
    .from("night_package_order_stops")
    .insert(stopRows);
  if (stopsError) {
    await admin.from("night_package_orders").delete().eq("id", order.id);
    throw new Error(stopsError.message);
  }

  await sendVibeRequestVenueNotifications(order.id as string);

  return {
    orderId: order.id as string,
    expiresAt,
    confirmationCode: order.confirmation_code as string,
  };
}

async function sendVibeRequestVenueNotifications(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("night_package_orders")
    .select(
      `
      id, party_size, starts_on, expires_at, confirmation_code,
      package:night_packages(title),
      stops:night_package_order_stops(
        id, venue_id, title, venue_payout_cents, party_size, status
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;

  const packageTitle =
    order.package && typeof order.package === "object" && !Array.isArray(order.package)
      ? ((order.package as { title?: string }).title ?? "Vibe")
      : "Vibe";

  const startsOnLabel =
    typeof order.starts_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(order.starts_on)
      ? formatVibeStartLabel(order.starts_on as `${number}-${number}-${number}`)
      : null;

  const stops =
    (order.stops as Array<{
      venue_id: string;
      title: string;
      venue_payout_cents: number;
      party_size: number;
      status: string;
    }>) ?? [];

  const venueIds = [...new Set(stops.map((s) => s.venue_id))];
  if (!venueIds.length) return;

  const { data: venues } = await admin
    .from("venues")
    .select("id, name, owner_id")
    .in("id", venueIds);

  const ownerIds = [
    ...new Set(
      (venues ?? [])
        .map((v) => v.owner_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const { data: owners } = ownerIds.length
    ? await admin.from("users").select("id, email, name").in("id", ownerIds)
    : { data: [] as Array<{ id: string; email: string; name: string }> };

  const ownerById = new Map(
    (owners ?? []).map((o) => [
      o.id as string,
      { email: o.email as string, name: (o.name as string) || "there" },
    ]),
  );
  const venueById = new Map(
    (venues ?? []).map((v) => [
      v.id as string,
      {
        name: (v.name as string) || "Venue",
        ownerId: v.owner_id as string | null,
      },
    ]),
  );

  const notifiedOwners = new Set<string>();

  for (const stop of stops) {
    if (stop.status !== "pending_venue") continue;
    const venue = venueById.get(stop.venue_id);
    if (!venue?.ownerId) continue;
    const owner = ownerById.get(venue.ownerId);
    if (!owner?.email) continue;

    notifyVenueVibeBookingRequest({
      venueOwnerEmail: owner.email,
      venueOwnerName: owner.name,
      venueName: venue.name,
      packageTitle,
      offerTitle: stop.title,
      startsOnLabel,
      partySize: stop.party_size || Number(order.party_size) || 1,
      payoutCents: Number(stop.venue_payout_cents) || 0,
      expiresAt: order.expires_at as string | null,
      confirmationCode: order.confirmation_code as string,
    });

    if (!notifiedOwners.has(venue.ownerId)) {
      notifiedOwners.add(venue.ownerId);
      void sendFcmToUser({
        userId: venue.ownerId,
        title: "New vibe booking request",
        body: `${stop.title} — confirm in Vibe bookings`,
        data: {
          type: "vibe_booking_request",
          order_id: orderId,
          path: "/vibe-bookings",
        },
      }).catch((err) => console.error("[vibe] FCM request failed", err));
    }
  }
}

export async function respondToVibeStopRequest(params: {
  stopId: string;
  venueOwnerId: string;
  decision: "confirm" | "decline";
}): Promise<{ orderId: string; orderStatus: string }> {
  await expireOverdueVibeRequests();

  const admin = createAdminClient();
  const { data: stop, error: stopError } = await admin
    .from("night_package_order_stops")
    .select(
      `
      id, order_id, venue_id, status, title,
      venue:venues(id, owner_id, name)
    `,
    )
    .eq("id", params.stopId)
    .maybeSingle();

  if (stopError || !stop) throw new Error("Booking request not found");

  const venueRaw = stop.venue as
    | { id: string; owner_id: string; name: string }
    | { id: string; owner_id: string; name: string }[]
    | null;
  const venue = Array.isArray(venueRaw) ? venueRaw[0] : venueRaw;
  if (!venue || venue.owner_id !== params.venueOwnerId) {
    throw new Error("Not authorized for this venue");
  }

  if (stop.status !== "pending_venue") {
    throw new Error("This request was already answered");
  }

  const { data: order } = await admin
    .from("night_package_orders")
    .select(
      "id, status, user_id, guest_email, guest_name, package_id, party_size, starts_on, total_cents, confirmation_code, package:night_packages(title, slug)",
    )
    .eq("id", stop.order_id)
    .maybeSingle();

  if (!order || order.status !== "requested") {
    throw new Error("This booking request is no longer open");
  }

  const now = new Date().toISOString();

  if (params.decision === "decline") {
    await admin
      .from("night_package_order_stops")
      .update({ status: "declined", venue_responded_at: now })
      .eq("id", stop.id);

    await admin
      .from("night_package_order_stops")
      .update({ status: "cancelled" })
      .eq("order_id", order.id)
      .eq("status", "pending_venue");

    await admin
      .from("night_package_orders")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", order.id);

    const pkgTitle =
      order.package && typeof order.package === "object" && !Array.isArray(order.package)
        ? ((order.package as { title?: string }).title ?? "your vibe")
        : "your vibe";

    if (order.guest_email) {
      notifyGuestVibeRequestDeclined({
        toEmail: order.guest_email as string,
        guestName: (order.guest_name as string) || "there",
        packageTitle: pkgTitle,
        venueName: venue.name,
      });
    }

    void sendFcmToUser({
      userId: order.user_id as string,
      title: "Vibe request declined",
      body: `${venue.name} can't host this stop — your request was cancelled.`,
      data: {
        type: "vibe_request_declined",
        order_id: order.id as string,
        path: "/packages/orders",
      },
    }).catch(() => undefined);

    return { orderId: order.id as string, orderStatus: "cancelled" };
  }

  // confirm
  await admin
    .from("night_package_order_stops")
    .update({ status: "confirmed", venue_responded_at: now })
    .eq("id", stop.id);

  const { data: remaining } = await admin
    .from("night_package_order_stops")
    .select("id, status")
    .eq("order_id", order.id);

  const stillPending = (remaining ?? []).some((s) => s.status === "pending_venue");
  if (stillPending) {
    return { orderId: order.id as string, orderStatus: "requested" };
  }

  const anyDeclined = (remaining ?? []).some((s) => s.status === "declined");
  if (anyDeclined) {
    await admin
      .from("night_package_orders")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", order.id);
    return { orderId: order.id as string, orderStatus: "cancelled" };
  }

  await admin
    .from("night_package_orders")
    .update({ status: "awaiting_payment", updated_at: now, expires_at: null })
    .eq("id", order.id);

  const pkg = order.package as
    | { title?: string; slug?: string | null }
    | { title?: string; slug?: string | null }[]
    | null;
  const pkgRow = Array.isArray(pkg) ? pkg[0] : pkg;
  const packageTitle = pkgRow?.title ?? "your vibe";
  const payPath = `/packages/${pkgRow?.slug || order.package_id}/checkout?orderId=${order.id}`;

  if (order.guest_email) {
    notifyGuestVibeAwaitingPayment({
      toEmail: order.guest_email as string,
      guestName: (order.guest_name as string) || "there",
      packageTitle,
      totalCents: Number(order.total_cents) || 0,
      payUrl: customerPortalUrl(payPath),
    });
  }

  void sendFcmToUser({
    userId: order.user_id as string,
    title: "Venues confirmed — pay to book",
    body: `${packageTitle} is ready. Complete payment to lock it in.`,
    data: {
      type: "vibe_awaiting_payment",
      order_id: order.id as string,
      path: payPath,
    },
  }).catch(() => undefined);

  return { orderId: order.id as string, orderStatus: "awaiting_payment" };
}

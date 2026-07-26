import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isIsoDateOnOrAfterToday } from "@/lib/event-dates";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getNightPackageCommissionPct,
  getPublishedNightPackageForCheckout,
  getStripe,
  resolveApprovedStopOffers,
} from "@/lib/stripe/server";
import {
  assertVibeVenuesConnectReady,
  connectGapErrorMessage,
} from "@/lib/stripe/vibe-marketplace";
import { buildMobilePayUrl } from "@/lib/stripe/mobile-pay-token";
import { expireOverdueVibeRequests } from "@/lib/data/vibe-request-book";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json();
  const packageId = body.packageId as string | undefined;
  const existingOrderId =
    typeof body.orderId === "string" && body.orderId.trim()
      ? body.orderId.trim()
      : null;
  const startsOn = String(body.startsOn ?? "").trim();
  const partySize = Math.max(1, Math.min(50, Number(body.partySize) || 1));
  const requestedStopIds = Array.isArray(body.stopOfferIds)
    ? (body.stopOfferIds as unknown[])
        .map((id) => String(id).trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  if (!packageId) {
    return NextResponse.json({ error: "packageId required" }, { status: 400 });
  }

  try {
    await expireOverdueVibeRequests();

    let resolvedPartySize = partySize;
    let resolvedStartsOn = startsOn;
    let stops;
    let orderMeta: { id: string } | null = null;

    if (existingOrderId) {
      const admin = createAdminClient();
      const { data: order } = await admin
        .from("night_package_orders")
        .select(
          `
          id, user_id, package_id, party_size, starts_on, status, total_cents,
          subtotal_cents, commission_cents,
          stops:night_package_order_stops(
            stop_offer_id, venue_id, title, slot_type, unit_price_cents, sort_order, scheduled_label, status
          )
        `,
        )
        .eq("id", existingOrderId)
        .maybeSingle();

      if (!order || order.user_id !== user.id) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (order.status !== "awaiting_payment") {
        return NextResponse.json(
          { error: "This plan is not ready for payment yet" },
          { status: 409 },
        );
      }
      if (order.package_id !== packageId) {
        return NextResponse.json({ error: "Package mismatch" }, { status: 409 });
      }

      resolvedPartySize = Number(order.party_size);
      resolvedStartsOn = String(order.starts_on ?? "");
      orderMeta = { id: order.id as string };

      const orderStops =
        (order.stops as Array<{
          stop_offer_id: string;
          venue_id: string;
          title: string;
          slot_type: string;
          unit_price_cents: number;
          sort_order: number;
          scheduled_label: string | null;
          status: string;
        }>) ?? [];

      if (!orderStops.every((s) => s.status === "confirmed")) {
        return NextResponse.json(
          { error: "Not all venues have confirmed yet" },
          { status: 409 },
        );
      }

      stops = orderStops
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => ({
          stop_offer_id: s.stop_offer_id,
          venue_id: s.venue_id,
          title: s.title,
          slot_type: s.slot_type,
          price_cents: s.unit_price_cents,
          sort_order: s.sort_order,
          scheduled_label: s.scheduled_label,
        }));
    } else {
      if (!isIsoDateOnOrAfterToday(resolvedStartsOn)) {
        return NextResponse.json(
          { error: "Pick a start date (today or later)" },
          { status: 400 },
        );
      }

      const pkg = await getPublishedNightPackageForCheckout(packageId);
      if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

      if (
        resolvedPartySize < pkg.party_size_min ||
        resolvedPartySize > pkg.party_size_max
      ) {
        return NextResponse.json(
          {
            error: `Party size must be between ${pkg.party_size_min} and ${pkg.party_size_max}`,
          },
          { status: 400 },
        );
      }

      stops =
        requestedStopIds.length > 0
          ? await resolveApprovedStopOffers(requestedStopIds)
          : pkg.stops;

      if (requestedStopIds.length > 0 && stops.length !== requestedStopIds.length) {
        return NextResponse.json(
          { error: "One or more selected stops are unavailable" },
          { status: 409 },
        );
      }
    }

    if (!stops.length) {
      return NextResponse.json({ error: "Add at least one stop to your plan" }, { status: 409 });
    }

    if (!isIsoDateOnOrAfterToday(resolvedStartsOn)) {
      return NextResponse.json(
        { error: "Pick a start date (today or later)" },
        { status: 400 },
      );
    }

    const connect = await assertVibeVenuesConnectReady(stops);
    if (!connect.ok) {
      return NextResponse.json(
        {
          error: connectGapErrorMessage(connect.gaps),
          venuesNeedingConnect: connect.gaps,
          canRequestBooking: !existingOrderId,
        },
        { status: 409 },
      );
    }

    const pkg = await getPublishedNightPackageForCheckout(packageId);
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    const unitSubtotal = stops.reduce((sum, s) => sum + s.price_cents, 0);
    if (unitSubtotal <= 0) {
      return NextResponse.json({ error: "Invalid package price" }, { status: 409 });
    }

    const commissionPct = await getNightPackageCommissionPct();
    const subtotalCents = unitSubtotal * resolvedPartySize;
    const commissionCents = Math.round((subtotalCents * commissionPct) / 100);
    const totalCents = subtotalCents + commissionCents;
    const stopOfferIdsMeta = stops.map((s) => s.stop_offer_id).join(",");

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "night_package_order",
        night_package_id: packageId,
        user_id: user.id,
        party_size: String(resolvedPartySize),
        starts_on: resolvedStartsOn,
        subtotal_cents: String(subtotalCents),
        commission_cents: String(commissionCents),
        commission_pct: String(commissionPct),
        stop_offer_ids: stopOfferIdsMeta,
        ...(orderMeta ? { night_package_order_id: orderMeta.id } : {}),
      },
    });

    const amount = totalCents / 100;
    const amountLabel = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);

    const mobilePayUrl = buildMobilePayUrl({
      clientSecret: intent.client_secret!,
      paymentIntentId: intent.id,
      userId: user.id,
      kind: "night_package",
      amountLabel,
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      mobilePayUrl,
      amount,
      subtotal: subtotalCents / 100,
      serviceFee: commissionCents / 100,
      commissionPct,
      packageName: pkg.title,
      partySize: resolvedPartySize,
      stopCount: stops.length,
      stopOfferIds: stops.map((s) => s.stop_offer_id),
      orderId: orderMeta?.id ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

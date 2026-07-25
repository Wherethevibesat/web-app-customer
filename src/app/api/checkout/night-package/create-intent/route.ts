import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isIsoDateOnOrAfterToday } from "@/lib/event-dates";
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

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json();
  const packageId = body.packageId as string | undefined;
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

  if (!isIsoDateOnOrAfterToday(startsOn)) {
    return NextResponse.json(
      { error: "Pick a start date (today or later)" },
      { status: 400 },
    );
  }

  try {
    const pkg = await getPublishedNightPackageForCheckout(packageId);
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    if (partySize < pkg.party_size_min || partySize > pkg.party_size_max) {
      return NextResponse.json(
        {
          error: `Party size must be between ${pkg.party_size_min} and ${pkg.party_size_max}`,
        },
        { status: 400 },
      );
    }

    const stops =
      requestedStopIds.length > 0
        ? await resolveApprovedStopOffers(requestedStopIds)
        : pkg.stops;

    if (requestedStopIds.length > 0 && stops.length !== requestedStopIds.length) {
      return NextResponse.json(
        { error: "One or more selected stops are unavailable" },
        { status: 409 },
      );
    }

    if (!stops.length) {
      return NextResponse.json({ error: "Add at least one stop to your plan" }, { status: 409 });
    }

    const connect = await assertVibeVenuesConnectReady(stops);
    if (!connect.ok) {
      return NextResponse.json(
        {
          error: connectGapErrorMessage(connect.gaps),
          venuesNeedingConnect: connect.gaps,
        },
        { status: 409 },
      );
    }

    const unitSubtotal = stops.reduce((sum, s) => sum + s.price_cents, 0);
    if (unitSubtotal <= 0) {
      return NextResponse.json({ error: "Invalid package price" }, { status: 409 });
    }

    const commissionPct = await getNightPackageCommissionPct();
    const subtotalCents = unitSubtotal * partySize;
    const commissionCents = Math.round((subtotalCents * commissionPct) / 100);
    const totalCents = subtotalCents + commissionCents;
    const stopOfferIdsMeta = stops.map((s) => s.stop_offer_id).join(",");

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      // Match web Payment Element — wallets / bank when Stripe offers them.
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "night_package_order",
        night_package_id: packageId,
        user_id: user.id,
        party_size: String(partySize),
        starts_on: startsOn,
        subtotal_cents: String(subtotalCents),
        commission_cents: String(commissionCents),
        commission_pct: String(commissionPct),
        stop_offer_ids: stopOfferIdsMeta,
      },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: totalCents / 100,
      subtotal: subtotalCents / 100,
      serviceFee: commissionCents / 100,
      commissionPct,
      packageName: pkg.title,
      partySize,
      stopCount: stops.length,
      stopOfferIds: stops.map((s) => s.stop_offer_id),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

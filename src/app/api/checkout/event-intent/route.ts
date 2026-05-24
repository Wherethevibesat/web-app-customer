import { NextResponse } from "next/server";
import { getTicketTier, tierSoldCount } from "@/lib/data/event-tickets";
import { requireUser } from "@/lib/auth/require-user";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { tierId, eventId } = await request.json();
  if (!tierId || !eventId) {
    return NextResponse.json({ error: "tierId and eventId required" }, { status: 400 });
  }

  try {
    const tier = await getTicketTier(tierId);
    if (!tier || tier.event_id !== eventId) {
      return NextResponse.json({ error: "Ticket tier not found" }, { status: 404 });
    }
    if (tier.price_cents <= 0) {
      return NextResponse.json({ error: "Use free RSVP for this tier" }, { status: 400 });
    }

    const sold = await tierSoldCount(tierId);
    if (tier.capacity != null && sold >= tier.capacity) {
      return NextResponse.json({ error: "This tier is sold out" }, { status: 409 });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: tier.price_cents,
      currency: "usd",
      metadata: {
        type: "event_registration",
        tier_id: tierId,
        event_id: eventId,
        user_id: user.id,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      tierName: tier.name,
      amount: tier.price_cents / 100,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

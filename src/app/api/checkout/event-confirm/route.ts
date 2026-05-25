import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { fulfillStripePaymentIntent, getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { paymentIntentId } = await request.json();
  if (!paymentIntentId) {
    return NextResponse.json({ error: "paymentIntentId required" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.metadata.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (intent.metadata.type !== "event_registration") {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }
    if (intent.status !== "succeeded") {
      return NextResponse.json({ status: "pending", paymentStatus: intent.status });
    }

    await fulfillStripePaymentIntent(intent);

    return NextResponse.json({ status: "confirmed", paymentStatus: intent.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Confirmation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

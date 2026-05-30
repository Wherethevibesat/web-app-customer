import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  fulfillStripePaymentIntent,
  getStripe,
  getStripeWebhookSecret,
  handlePaymentIntentFailure,
} from "@/lib/stripe/server";

export const runtime = "nodejs";

function asPaymentIntent(object: unknown): Stripe.PaymentIntent | null {
  if (!object || typeof object !== "object") return null;
  if (!("object" in object) || object.object !== "payment_intent") return null;
  return object as Stripe.PaymentIntent;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const secret = getStripeWebhookSecret();
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, secret);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = asPaymentIntent(event.data.object);
        if (intent) {
          await fulfillStripePaymentIntent(intent);
        }
        break;
      }
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const intent = asPaymentIntent(event.data.object);
        if (intent) {
          await handlePaymentIntentFailure(intent);
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

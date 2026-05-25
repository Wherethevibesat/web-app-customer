import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fulfillStripePaymentIntent, getStripe, recordVipOrder } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

    const status = intent.status === "succeeded" ? "paid" : "failed";
    if (status === "paid") {
      await fulfillStripePaymentIntent(intent);
    } else if (intent.metadata.vip_package_id) {
      await recordVipOrder({
        userId: user.id,
        vipPackageId: intent.metadata.vip_package_id,
        eventId: intent.metadata.event_id || null,
        amount: intent.amount / 100,
        paymentIntentId,
        status: "failed",
      });
    }

    return NextResponse.json({ status, paymentStatus: intent.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Confirmation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

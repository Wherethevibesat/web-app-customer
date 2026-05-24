import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { confirmDriverBookingPayment, getStripe } from "@/lib/stripe/server";

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
    if (intent.metadata.type !== "driver_booking") {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }
    if (intent.status !== "succeeded") {
      return NextResponse.json({ status: "pending", paymentStatus: intent.status });
    }

    const bookingId = intent.metadata.booking_id;
    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking" }, { status: 400 });
    }

    await confirmDriverBookingPayment({
      bookingId,
      userId: user.id,
      paymentIntentId,
    });

    return NextResponse.json({ status: "confirmed", paymentStatus: intent.status, bookingId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Confirmation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

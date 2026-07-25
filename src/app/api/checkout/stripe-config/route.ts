import { NextResponse } from "next/server";
import { getPublishableKey } from "@/lib/stripe/server";

/** Public Stripe publishable key for native PaymentSheet (Flutter). */
export async function GET() {
  const publishableKey = await getPublishableKey();
  if (!publishableKey) {
    return NextResponse.json(
      { error: "Checkout is not configured", publishableKey: null },
      { status: 503 },
    );
  }
  return NextResponse.json({ publishableKey });
}

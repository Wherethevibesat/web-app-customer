import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveConnectedStripeAccount,
  getStripe,
  getVipCommissionPct,
  getVipPackage,
} from "@/lib/stripe/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { packageId } = await request.json();
  if (!packageId) {
    return NextResponse.json({ error: "packageId required" }, { status: 400 });
  }

  try {
    const pkg = await getVipPackage(packageId);
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    const amountCents = Math.round(Number(pkg.price) * 100);
    const venue = pkg.venue as { owner_id?: string | null } | null;
    if (!venue?.owner_id) {
      return NextResponse.json(
        { error: "This VIP package does not have a payout owner configured." },
        { status: 409 },
      );
    }

    const destinationAccountId = await getActiveConnectedStripeAccount(venue.owner_id);
    if (!destinationAccountId) {
      return NextResponse.json(
        {
          error:
            "This venue is not ready to accept VIP payments yet. Ask the venue owner to finish Stripe onboarding in the business portal.",
        },
        { status: 409 },
      );
    }

    const commissionPct = await getVipCommissionPct();
    const platformFee = Math.round((amountCents * commissionPct) / 100);
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      ...(platformFee > 0 ? { application_fee_amount: platformFee } : {}),
      transfer_data: {
        destination: destinationAccountId,
      },
      metadata: {
        type: "vip_order",
        vip_package_id: packageId,
        user_id: user.id,
        event_id: pkg.event_id ?? "",
        destination_account_id: destinationAccountId,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      amount: pkg.price,
      packageName: pkg.package_name,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

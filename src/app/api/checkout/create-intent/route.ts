import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getVipPackage } from "@/lib/stripe/server";

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
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: {
        vip_package_id: packageId,
        user_id: user.id,
        event_id: pkg.event_id ?? "",
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

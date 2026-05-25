import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getDriverPackageForBooking } from "@/lib/data/drivers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActiveConnectedStripeAccount,
  getDriverBookingCommissionPct,
  getStripe,
} from "@/lib/stripe/server";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json();
  const {
    packageId,
    pickupAddress,
    dropoffAddress,
    scheduledStartsAt,
    customerNotes,
  } = body;

  if (!packageId || !pickupAddress?.trim() || !scheduledStartsAt) {
    return NextResponse.json(
      { error: "packageId, pickupAddress, and scheduledStartsAt are required" },
      { status: 400 },
    );
  }

  const scheduled = new Date(scheduledStartsAt);
  if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() < Date.now()) {
    return NextResponse.json({ error: "Pick a future date and time" }, { status: 400 });
  }

  try {
    const pkg = await getDriverPackageForBooking(packageId);
    if (!pkg) return NextResponse.json({ error: "Package not available" }, { status: 404 });
    if (pkg.price_cents <= 0) {
      return NextResponse.json({ error: "This package requires a paid price" }, { status: 400 });
    }

    const commissionPct = await getDriverBookingCommissionPct();
    const platformFee = Math.round((pkg.price_cents * commissionPct) / 100);
    const driverPayout = pkg.price_cents - platformFee;
    const destinationAccountId = await getActiveConnectedStripeAccount(pkg.owner_id);

    if (!destinationAccountId) {
      return NextResponse.json(
        {
          error:
            "This driver is not ready to accept payments yet. Ask them to finish Stripe onboarding in the business portal.",
        },
        { status: 409 },
      );
    }

    const admin = createAdminClient();
    const { data: booking, error: bookingError } = await admin
      .from("driver_bookings")
      .insert({
        company_id: pkg.company_id,
        vehicle_id: pkg.vehicle_id,
        package_id: pkg.id,
        customer_id: user.id,
        pickup_address: pickupAddress.trim(),
        dropoff_address: dropoffAddress?.trim() || null,
        scheduled_starts_at: scheduled.toISOString(),
        duration_hours: pkg.duration_hours,
        price_cents: pkg.price_cents,
        platform_fee_cents: platformFee,
        driver_payout_cents: driverPayout,
        status: "pending_payment",
        customer_notes: typeof customerNotes === "string" ? customerNotes.trim() : "",
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      throw bookingError ?? new Error("Could not create booking");
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: pkg.price_cents,
      currency: "usd",
      ...(platformFee > 0 ? { application_fee_amount: platformFee } : {}),
      transfer_data: {
        destination: destinationAccountId,
      },
      metadata: {
        type: "driver_booking",
        booking_id: booking.id as string,
        package_id: pkg.id,
        company_id: pkg.company_id,
        destination_account_id: destinationAccountId,
        user_id: user.id,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      bookingId: booking.id,
      amount: pkg.price_cents / 100,
      packageLabel: pkg.label,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

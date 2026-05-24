import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export async function getPublishableKey(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stripe_settings")
    .select("publishable_key")
    .eq("id", 1)
    .maybeSingle();
  return data?.publishable_key ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}

export async function getVipPackage(packageId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vip_packages")
    .select("*, event:events(id, title), venue:venues(id, name)")
    .eq("id", packageId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordVipOrder(params: {
  userId: string;
  vipPackageId: string;
  eventId: string | null;
  amount: number;
  paymentIntentId: string;
  status: "paid" | "failed";
}) {
  const admin = createAdminClient();
  await admin.from("vip_orders").insert({
    user_id: params.userId,
    vip_package_id: params.vipPackageId,
    event_id: params.eventId,
    amount: params.amount,
    stripe_payment_intent_id: params.paymentIntentId,
    status: params.status,
    updated_at: new Date().toISOString(),
  });
}

export async function recordEventRegistration(params: {
  userId: string;
  eventId: string;
  tierId: string;
  amountCents: number;
  paymentIntentId: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("event_registrations").insert({
    event_id: params.eventId,
    tier_id: params.tierId,
    user_id: params.userId,
    status: "confirmed",
    quantity: 1,
    amount_cents: params.amountCents,
    stripe_payment_intent_id: params.paymentIntentId,
    updated_at: new Date().toISOString(),
  });
  if (error && error.code !== "23505") throw error;
}

export async function getDriverBookingCommissionPct(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("driver_booking_commission_pct")
    .eq("id", 1)
    .maybeSingle();
  return Number(data?.driver_booking_commission_pct ?? 10);
}

export async function confirmDriverBookingPayment(params: {
  bookingId: string;
  userId: string;
  paymentIntentId: string;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("driver_bookings")
    .select("id, status, stripe_payment_intent_id")
    .eq("id", params.bookingId)
    .eq("customer_id", params.userId)
    .maybeSingle();

  if (!existing) throw new Error("Booking not found");
  if (
    existing.stripe_payment_intent_id === params.paymentIntentId &&
    existing.status === "pending_driver"
  ) {
    return;
  }
  if (existing.status !== "pending_payment") {
    throw new Error("Booking cannot be confirmed");
  }

  const { error } = await admin
    .from("driver_bookings")
    .update({
      stripe_payment_intent_id: params.paymentIntentId,
      status: "pending_driver",
      updated_at: now,
    })
    .eq("id", params.bookingId)
    .eq("customer_id", params.userId);

  if (error) throw error;
}

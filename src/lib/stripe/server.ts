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

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return secret;
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
    .select("*, event:events(id, title), venue:venues(id, name, owner_id)")
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
  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("vip_orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", params.paymentIntentId)
    .maybeSingle();

  if (existing?.id) {
    if (existing.status === params.status) return;
    const { error: updateError } = await admin
      .from("vip_orders")
      .update({
        status: params.status,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return;
  }

  const { error } = await admin.from("vip_orders").insert({
    user_id: params.userId,
    vip_package_id: params.vipPackageId,
    event_id: params.eventId,
    amount: params.amount,
    stripe_payment_intent_id: params.paymentIntentId,
    status: params.status,
    updated_at: now,
  });
  if (error && error.code !== "23505") throw error;

  if (error?.code === "23505") {
    const { error: updateError } = await admin
      .from("vip_orders")
      .update({
        status: params.status,
        updated_at: now,
      })
      .eq("stripe_payment_intent_id", params.paymentIntentId);
    if (updateError) throw updateError;
  }
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

export async function getEventTicketCommissionPct(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("event_ticket_commission_pct")
    .eq("id", 1)
    .maybeSingle();
  return Number(data?.event_ticket_commission_pct ?? 10);
}

export async function getVipCommissionPct(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("vip_commission_pct")
    .eq("id", 1)
    .maybeSingle();
  return Number(data?.vip_commission_pct ?? 10);
}

type StripeAccountRow = {
  stripe_account_id: string;
};

export async function getActiveConnectedStripeAccount(
  userId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stripe_accounts")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as StripeAccountRow | null;
  if (!row?.stripe_account_id) return null;

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(row.stripe_account_id);
  if (("deleted" in account && account.deleted) || !account.charges_enabled || !account.payouts_enabled) {
    return null;
  }

  return account.id;
}

const COMMISSION_TYPES: Record<string, string> = {
  vip_order: "vip_commission",
  event_registration: "event_ticket_commission",
  driver_booking: "driver_booking_commission",
};

export async function recordPlatformTransaction(params: {
  userId: string | null;
  type: string;
  amount: number;
  description: string;
  status: "completed" | "failed" | "pending";
  paymentIntentId: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("platform_transactions")
    .select("id")
    .eq("stripe_payment_intent_id", params.paymentIntentId)
    .eq("type", params.type)
    .maybeSingle();
  if (existing?.id) return;

  const { error } = await admin.from("platform_transactions").insert({
    user_id: params.userId,
    type: params.type,
    amount: params.amount,
    description: params.description,
    status: params.status,
    stripe_payment_intent_id: params.paymentIntentId,
    metadata: params.metadata ?? {},
  });
  if (error && error.code !== "23505") throw error;
}

async function recordMarketplaceCommission(intent: Stripe.PaymentIntent) {
  const feeCents = intent.application_fee_amount ?? 0;
  if (feeCents <= 0 || intent.status !== "succeeded") return;

  const paymentType = intent.metadata.type ?? (intent.metadata.vip_package_id ? "vip_order" : "");
  const commissionType = COMMISSION_TYPES[paymentType];
  if (!commissionType) return;

  const labels: Record<string, string> = {
    vip_commission: "VIP sale commission",
    event_ticket_commission: "Event ticket commission",
    driver_booking_commission: "Driver booking commission",
  };

  await recordPlatformTransaction({
    userId: intent.metadata.user_id ?? null,
    type: commissionType,
    amount: feeCents / 100,
    description: labels[commissionType] ?? "Marketplace commission",
    status: "completed",
    paymentIntentId: intent.id,
    metadata: {
      payment_type: paymentType,
      destination_account_id: intent.metadata.destination_account_id ?? null,
    },
  });
}

export async function handlePaymentIntentFailure(intent: Stripe.PaymentIntent) {
  const paymentType = intent.metadata.type ?? (intent.metadata.vip_package_id ? "vip_order" : "");

  if (paymentType === "vip_order" || intent.metadata.vip_package_id) {
    const vipPackageId = intent.metadata.vip_package_id;
    const userId = intent.metadata.user_id;
    if (vipPackageId && userId) {
      await recordVipOrder({
        userId,
        vipPackageId,
        eventId: intent.metadata.event_id || null,
        amount: intent.amount / 100,
        paymentIntentId: intent.id,
        status: "failed",
      });
    }
    return;
  }

  if (paymentType === "driver_booking") {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const bookingId = intent.metadata.booking_id;
    if (bookingId) {
      await admin
        .from("driver_bookings")
        .update({ status: "cancelled", updated_at: now })
        .eq("id", bookingId)
        .eq("status", "pending_payment");
    }
    await admin
      .from("driver_bookings")
      .update({ status: "cancelled", updated_at: now })
      .eq("stripe_payment_intent_id", intent.id)
      .eq("status", "pending_payment");
  }
}

export async function confirmDriverBookingPayment(params: {
  bookingId: string;
  userId: string;
  paymentIntentId: string;
}): Promise<{ updated: boolean }> {
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
    return { updated: false };
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
  return { updated: true };
}

export async function fulfillStripePaymentIntent(
  intent: Stripe.PaymentIntent,
): Promise<{ kind: "driver_booking" | "event_registration" | "vip_order" | "ignored"; updated: boolean }> {
  const type = intent.metadata.type;

  if (type === "driver_booking") {
    const bookingId = intent.metadata.booking_id;
    const userId = intent.metadata.user_id;
    if (!bookingId || !userId) throw new Error("Driver booking metadata is incomplete.");

    const result = await confirmDriverBookingPayment({
      bookingId,
      userId,
      paymentIntentId: intent.id,
    });

    if (result.updated) {
      const { sendDriverBookingPaidNotifications } = await import(
        "@/lib/data/driver-notifications"
      );
      void sendDriverBookingPaidNotifications(bookingId).catch((err) =>
        console.error("[email] driver booking paid notifications failed:", err),
      );
      await recordMarketplaceCommission(intent);
    }

    return { kind: "driver_booking", updated: result.updated };
  }

  if (type === "event_registration") {
    const eventId = intent.metadata.event_id;
    const tierId = intent.metadata.tier_id;
    const userId = intent.metadata.user_id;
    if (!eventId || !tierId || !userId) {
      throw new Error("Event registration metadata is incomplete.");
    }

    await recordEventRegistration({
      userId,
      eventId,
      tierId,
      amountCents: intent.amount_received ?? intent.amount,
      paymentIntentId: intent.id,
    });
    await recordMarketplaceCommission(intent);
    return { kind: "event_registration", updated: true };
  }

  if (type === "vip_order" || intent.metadata.vip_package_id) {
    const vipPackageId = intent.metadata.vip_package_id;
    const userId = intent.metadata.user_id;
    if (!vipPackageId || !userId) throw new Error("VIP order metadata is incomplete.");

    await recordVipOrder({
      userId,
      vipPackageId,
      eventId: intent.metadata.event_id || null,
      amount: (intent.amount_received ?? intent.amount) / 100,
      paymentIntentId: intent.id,
      status: intent.status === "succeeded" ? "paid" : "failed",
    });
    await recordMarketplaceCommission(intent);
    return { kind: "vip_order", updated: true };
  }

  return { kind: "ignored", updated: false };
}

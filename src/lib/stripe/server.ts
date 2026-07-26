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
  const fromDb = data?.publishable_key?.trim() || null;
  const fromEnv = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;
  return fromDb ?? fromEnv;
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

export async function getNightPackageCommissionPct(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("night_package_commission_pct")
    .eq("id", 1)
    .maybeSingle();
  return Number(data?.night_package_commission_pct ?? 15);
}

export type NightPackageCheckoutStop = {
  stop_offer_id: string;
  venue_id: string;
  title: string;
  slot_type: string;
  price_cents: number;
  sort_order: number;
  scheduled_label: string | null;
};

export type NightPackageCheckout = {
  id: string;
  title: string;
  party_size_min: number;
  party_size_max: number;
  stops: NightPackageCheckoutStop[];
};

export async function getPublishedNightPackageForCheckout(
  packageId: string,
  options?: { useAdmin?: boolean },
): Promise<NightPackageCheckout | null> {
  const supabase = options?.useAdmin ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("night_packages")
    .select(
      `
      id, title, party_size_min, party_size_max, status,
      stops:night_package_stops(
        sort_order, scheduled_label, stop_offer_id,
        stop_offer:package_stop_offers(
          id, title, slot_type, price_cents, status, is_active, diy_pool, venue_id
        )
      )
    `,
    )
    .eq("id", packageId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  type Offer = {
    id: string;
    title: string;
    slot_type: string;
    price_cents: number;
    status: string;
    is_active: boolean;
    diy_pool?: boolean;
    venue_id: string;
  };

  type RawStop = {
    sort_order: number;
    scheduled_label: string | null;
    stop_offer_id: string;
    stop_offer: Offer | Offer[] | null;
  };

  const stops = ((data.stops as unknown as RawStop[]) ?? [])
    .map((s) => {
      const offer = Array.isArray(s.stop_offer) ? s.stop_offer[0] : s.stop_offer;
      return { ...s, stop_offer: offer ?? null };
    })
    .filter(
      (s) =>
        s.stop_offer &&
        s.stop_offer.is_active &&
        (s.stop_offer.status === "approved" || s.stop_offer.diy_pool === true),
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({
      stop_offer_id: s.stop_offer!.id,
      venue_id: s.stop_offer!.venue_id,
      title: s.stop_offer!.title,
      slot_type: s.stop_offer!.slot_type,
      price_cents: s.stop_offer!.price_cents,
      sort_order: s.sort_order,
      scheduled_label: s.scheduled_label,
    }));

  return {
    id: data.id as string,
    title: data.title as string,
    party_size_min: Number(data.party_size_min ?? 1),
    party_size_max: Number(data.party_size_max ?? 20),
    stops,
  };
}

export async function resolveApprovedStopOffers(
  stopOfferIds: string[],
  options?: { useAdmin?: boolean },
): Promise<NightPackageCheckoutStop[]> {
  const unique = [...new Set(stopOfferIds.map((id) => id.trim()).filter(Boolean))];
  if (!unique.length) return [];

  const supabase = options?.useAdmin ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("package_stop_offers")
    .select("id, title, slot_type, price_cents, status, is_active, diy_pool, venue_id")
    .in("id", unique)
    .eq("is_active", true)
    .or("status.eq.approved,diy_pool.eq.true");
  if (error) throw error;

  const byId = new Map(
    (data ?? []).map((row) => [
      row.id as string,
      {
        stop_offer_id: row.id as string,
        venue_id: row.venue_id as string,
        title: row.title as string,
        slot_type: row.slot_type as string,
        price_cents: Number(row.price_cents),
        sort_order: 0,
        scheduled_label: null as string | null,
      },
    ]),
  );

  return unique
    .map((id, index) => {
      const stop = byId.get(id);
      if (!stop) return null;
      return { ...stop, sort_order: index };
    })
    .filter((s): s is NightPackageCheckoutStop => s != null);
}

export function parseStopOfferIdsFromMetadata(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function recordNightPackageOrder(params: {
  userId: string;
  packageId: string;
  partySize: number;
  subtotalCents: number;
  commissionCents: number;
  totalCents: number;
  paymentIntentId: string;
  status: "paid" | "failed";
  stopOfferIds?: string[];
  startsOn?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
}): Promise<{ orderId: string | null; created: boolean }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("night_package_orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", params.paymentIntentId)
    .maybeSingle();

  if (existing?.id) {
    if (existing.status === params.status) {
      return { orderId: existing.id as string, created: false };
    }
    const { error: updateError } = await admin
      .from("night_package_orders")
      .update({
        status: params.status,
        paid_at: params.status === "paid" ? now : null,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return { orderId: existing.id as string, created: false };
  }

  // Only persist successful night-package orders (failed PIs leave no row).
  if (params.status !== "paid") {
    return { orderId: null, created: false };
  }

  const pkg = await getPublishedNightPackageForCheckout(params.packageId, {
    useAdmin: true,
  });
  if (!pkg) throw new Error("Night package unavailable");

  const stops =
    params.stopOfferIds && params.stopOfferIds.length > 0
      ? await resolveApprovedStopOffers(params.stopOfferIds, { useAdmin: true })
      : pkg.stops;
  if (!stops.length) throw new Error("Night package stops unavailable");

  const { data: order, error: orderError } = await admin
    .from("night_package_orders")
    .insert({
      package_id: params.packageId,
      user_id: params.userId,
      party_size: params.partySize,
      starts_on: params.startsOn ?? null,
      subtotal_cents: params.subtotalCents,
      commission_cents: params.commissionCents,
      total_cents: params.totalCents,
      status: "paid",
      stripe_payment_intent_id: params.paymentIntentId,
      guest_name: params.guestName ?? null,
      guest_email: params.guestEmail ?? null,
      paid_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (orderError) {
    if (orderError.code === "23505") {
      const { data: again } = await admin
        .from("night_package_orders")
        .select("id")
        .eq("stripe_payment_intent_id", params.paymentIntentId)
        .maybeSingle();
      return { orderId: (again?.id as string) ?? null, created: false };
    }
    throw orderError;
  }

  // Guest paid service fee on top; venue line totals are Transferred after insert.
  const stopRows = stops.map((stop) => {
    const lineTotal = stop.price_cents * params.partySize;
    return {
      order_id: order.id,
      stop_offer_id: stop.stop_offer_id,
      venue_id: stop.venue_id,
      sort_order: stop.sort_order,
      title: stop.title,
      slot_type: stop.slot_type,
      unit_price_cents: stop.price_cents,
      party_size: params.partySize,
      line_total_cents: lineTotal,
      venue_payout_cents: lineTotal,
      scheduled_label: stop.scheduled_label,
      status: "confirmed",
      payout_status: "pending",
    };
  });

  const { error: stopsError } = await admin
    .from("night_package_order_stops")
    .insert(stopRows);
  if (stopsError) throw stopsError;

  return { orderId: order.id as string, created: true };
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
  night_package_order: "night_package_commission",
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
    night_package_commission: "Build Your Night commission",
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

async function recordNightPackagePlatformCommission(intent: Stripe.PaymentIntent) {
  if (intent.status !== "succeeded") return;
  const commissionCents = Number(intent.metadata.commission_cents ?? 0);
  if (!Number.isFinite(commissionCents) || commissionCents <= 0) return;

  await recordPlatformTransaction({
    userId: intent.metadata.user_id ?? null,
    type: "night_package_commission",
    amount: commissionCents / 100,
    description: "Build Your Night commission",
    status: "completed",
    paymentIntentId: intent.id,
    metadata: {
      payment_type: "night_package_order",
      night_package_id: intent.metadata.night_package_id ?? null,
      party_size: intent.metadata.party_size ?? null,
    },
  });
}

export async function handlePaymentIntentFailure(intent: Stripe.PaymentIntent) {
  const paymentType = intent.metadata.type ?? (intent.metadata.vip_package_id ? "vip_order" : "");

  if (paymentType === "night_package_order" || intent.metadata.night_package_id) {
    const packageId = intent.metadata.night_package_id;
    const userId = intent.metadata.user_id;
    if (packageId && userId) {
      await recordNightPackageOrder({
        userId,
        packageId,
        partySize: Number(intent.metadata.party_size ?? 1) || 1,
        subtotalCents: Number(intent.metadata.subtotal_cents ?? intent.amount) || intent.amount,
        commissionCents: Number(intent.metadata.commission_cents ?? 0) || 0,
        totalCents: intent.amount,
        paymentIntentId: intent.id,
        status: "failed",
        startsOn: intent.metadata.starts_on || null,
      });
    }
    return;
  }

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
): Promise<{
  kind:
    | "driver_booking"
    | "event_registration"
    | "vip_order"
    | "night_package_order"
    | "ignored";
  updated: boolean;
}> {
  const type = intent.metadata.type;

  if (type === "vibe_payment_share") {
    const userId = intent.metadata.user_id;
    if (!userId) throw new Error("Share payment metadata is incomplete.");
    if (intent.status !== "succeeded") {
      return { kind: "ignored", updated: false };
    }
    const { confirmSharePayment } = await import("@/lib/stripe/vibe-split");
    const result = await confirmSharePayment({
      paymentIntentId: intent.id,
      userId,
    });
    return {
      kind: "night_package_order",
      updated: result.status === "group_paid",
    };
  }

  if (type === "night_package_order" || intent.metadata.night_package_id) {
    const packageId = intent.metadata.night_package_id;
    const userId = intent.metadata.user_id;
    if (!packageId || !userId) {
      throw new Error("Night package order metadata is incomplete.");
    }

    const result = await recordNightPackageOrder({
      userId,
      packageId,
      partySize: Number(intent.metadata.party_size ?? 1) || 1,
      subtotalCents: Number(intent.metadata.subtotal_cents ?? intent.amount) || intent.amount,
      commissionCents: Number(intent.metadata.commission_cents ?? 0) || 0,
      totalCents: intent.amount_received ?? intent.amount,
      paymentIntentId: intent.id,
      status: intent.status === "succeeded" ? "paid" : "failed",
      stopOfferIds: parseStopOfferIdsFromMetadata(intent.metadata.stop_offer_ids),
      startsOn: intent.metadata.starts_on || null,
    });
    if (result.created) {
      await recordNightPackagePlatformCommission(intent);
    }
    if (result.orderId && intent.status === "succeeded") {
      const { finalizeNightPackageMarketplace } = await import(
        "@/lib/stripe/vibe-marketplace"
      );
      void finalizeNightPackageMarketplace(result.orderId).catch((err) =>
        console.error("[vibe] marketplace finalize failed:", err),
      );
    }
    return { kind: "night_package_order", updated: result.created };
  }

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

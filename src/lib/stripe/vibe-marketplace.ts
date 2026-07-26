import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export type NightPackageCheckoutStopRef = {
  venue_id: string;
  title?: string;
};

export type VibeConnectGap = {
  venueId: string;
  venueName: string;
};

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

async function getActiveConnectedStripeAccount(
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

  const accountId = data?.stripe_account_id as string | undefined;
  if (!accountId) return null;

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  if (
    ("deleted" in account && account.deleted) ||
    !account.charges_enabled ||
    !account.payouts_enabled
  ) {
    return null;
  }
  return account.id;
}

/** Ensure every stop venue has an active Connect account ready for Transfers. */
export async function assertVibeVenuesConnectReady(
  stops: NightPackageCheckoutStopRef[],
): Promise<
  | { ok: true; accountsByVenueId: Map<string, string> }
  | { ok: false; gaps: VibeConnectGap[] }
> {
  const admin = createAdminClient();
  const venueIds = [...new Set(stops.map((s) => s.venue_id).filter(Boolean))];
  if (!venueIds.length) {
    return { ok: false, gaps: [{ venueId: "", venueName: "Unknown place" }] };
  }

  const { data: venues, error } = await admin
    .from("venues")
    .select("id, name, owner_id")
    .in("id", venueIds);
  if (error) throw error;

  const byId = new Map(
    (venues ?? []).map((v) => [
      v.id as string,
      {
        name: (v.name as string) || "Venue",
        ownerId: v.owner_id as string | null,
      },
    ]),
  );

  const gaps: VibeConnectGap[] = [];
  const accountsByVenueId = new Map<string, string>();

  for (const venueId of venueIds) {
    const venue = byId.get(venueId);
    if (!venue?.ownerId) {
      gaps.push({ venueId, venueName: venue?.name ?? "Venue" });
      continue;
    }
    const accountId = await getActiveConnectedStripeAccount(venue.ownerId);
    if (!accountId) {
      gaps.push({ venueId, venueName: venue.name });
      continue;
    }
    accountsByVenueId.set(venueId, accountId);
  }

  if (gaps.length) return { ok: false, gaps };
  return { ok: true, accountsByVenueId };
}

export function connectGapErrorMessage(gaps: VibeConnectGap[]): string {
  const names = gaps.map((g) => g.venueName).filter(Boolean);
  if (!names.length) {
    return "One or more places are not ready for instant checkout yet — you can request to book instead.";
  }
  return `These places still need Stripe Connect for instant checkout: ${names.join(", ")}. You can request to book while they set up payouts.`;
}

/** Transfer each stop payout to the venue Connect account. Idempotent per stop. */
export async function transferNightPackageVenuePayouts(
  orderId: string,
): Promise<void> {
  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: stops, error } = await admin
    .from("night_package_order_stops")
    .select(
      "id, venue_id, venue_payout_cents, stripe_transfer_id, payout_status, title",
    )
    .eq("order_id", orderId)
    .order("sort_order");
  if (error) throw error;
  if (!stops?.length) return;

  const venueIds = [...new Set(stops.map((s) => s.venue_id as string))];
  const { data: venues } = await admin
    .from("venues")
    .select("id, owner_id")
    .in("id", venueIds);
  const ownerByVenue = new Map(
    (venues ?? []).map((v) => [v.id as string, v.owner_id as string | null]),
  );

  for (const stop of stops) {
    if (stop.stripe_transfer_id || stop.payout_status === "transferred") {
      continue;
    }

    const amount = Number(stop.venue_payout_cents ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      await admin
        .from("night_package_order_stops")
        .update({ payout_status: "skipped" })
        .eq("id", stop.id);
      continue;
    }

    const ownerId = ownerByVenue.get(stop.venue_id as string);
    if (!ownerId) {
      await admin
        .from("night_package_order_stops")
        .update({ payout_status: "failed" })
        .eq("id", stop.id);
      console.error("[vibe-payout] missing venue owner", stop.id, stop.venue_id);
      continue;
    }

    const destination = await getActiveConnectedStripeAccount(ownerId);
    if (!destination) {
      await admin
        .from("night_package_order_stops")
        .update({ payout_status: "failed" })
        .eq("id", stop.id);
      console.error("[vibe-payout] Connect not ready", stop.id, stop.venue_id);
      continue;
    }

    try {
      const transfer = await stripe.transfers.create({
        amount,
        currency: "usd",
        destination,
        transfer_group: orderId,
        metadata: {
          order_id: orderId,
          order_stop_id: stop.id as string,
          venue_id: stop.venue_id as string,
          type: "night_package_venue_payout",
        },
      });
      await admin
        .from("night_package_order_stops")
        .update({
          stripe_transfer_id: transfer.id,
          payout_status: "transferred",
        })
        .eq("id", stop.id);
    } catch (err) {
      console.error("[vibe-payout] transfer failed", stop.id, err);
      await admin
        .from("night_package_order_stops")
        .update({ payout_status: "failed" })
        .eq("id", stop.id);
    }
  }
}

/** Retry failed transfers for an order (admin / ops). */
export async function retryFailedNightPackageTransfers(orderId: string): Promise<{
  retried: number;
}> {
  const admin = createAdminClient();
  await admin
    .from("night_package_order_stops")
    .update({ payout_status: "pending", stripe_transfer_id: null })
    .eq("order_id", orderId)
    .eq("payout_status", "failed");
  await transferNightPackageVenuePayouts(orderId);
  const { data } = await admin
    .from("night_package_order_stops")
    .select("id")
    .eq("order_id", orderId)
    .eq("payout_status", "transferred");
  return { retried: data?.length ?? 0 };
}

export function evenSplitCents(totalCents: number, payerCount: number): number[] {
  const n = Math.max(2, Math.min(20, Math.floor(payerCount)));
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  const shares = Array.from({ length: n }, () => base);
  shares[0] += remainder;
  return shares;
}

/** After order row exists: transfer + notify. Safe to call multiple times. */
export async function finalizeNightPackageMarketplace(
  orderId: string,
): Promise<void> {
  await transferNightPackageVenuePayouts(orderId);
  try {
    const { sendVibeBookingVenueNotifications } = await import(
      "@/lib/data/vibe-booking-notifications"
    );
    await sendVibeBookingVenueNotifications(orderId);
  } catch (err) {
    console.error("[vibe] venue notifications failed", orderId, err);
  }
}

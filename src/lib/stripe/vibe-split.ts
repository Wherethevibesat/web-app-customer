import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getNightPackageCommissionPct,
  getPublishedNightPackageForCheckout,
  getStripe,
  recordNightPackageOrder,
  resolveApprovedStopOffers,
} from "@/lib/stripe/server";
import {
  assertVibeVenuesConnectReady,
  connectGapErrorMessage,
  evenSplitCents,
  finalizeNightPackageMarketplace,
} from "@/lib/stripe/vibe-marketplace";
import { isIsoDateOnOrAfterToday } from "@/lib/event-dates";

const GROUP_TTL_MS = 24 * 60 * 60 * 1000;

export function newInviteToken() {
  return randomBytes(18).toString("base64url");
}

export async function expireGroupIfNeeded(groupId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: group } = await admin
    .from("vibe_payment_groups")
    .select("id, status, expires_at")
    .eq("id", groupId)
    .maybeSingle();
  if (!group || group.status !== "collecting") return false;
  if (new Date(group.expires_at as string).getTime() > Date.now()) return false;

  await admin
    .from("vibe_payment_groups")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", groupId)
    .eq("status", "collecting");
  return true;
}

export async function createVibePaymentGroup(params: {
  hostUserId: string;
  packageId: string;
  partySize: number;
  startsOn: string;
  stopOfferIds: string[];
  payerCount: number;
}): Promise<{
  groupId: string;
  inviteToken: string;
  shareIds: string[];
  amounts: number[];
  totalCents: number;
  expiresAt: string;
}> {
  if (!isIsoDateOnOrAfterToday(params.startsOn)) {
    throw new Error("Pick a start date (today or later)");
  }
  const payerCount = Math.max(2, Math.min(20, Math.floor(params.payerCount)));

  const pkg = await getPublishedNightPackageForCheckout(params.packageId, {
    useAdmin: true,
  });
  if (!pkg) throw new Error("Package not found");

  if (
    params.partySize < pkg.party_size_min ||
    params.partySize > pkg.party_size_max
  ) {
    throw new Error(
      `Party size must be between ${pkg.party_size_min} and ${pkg.party_size_max}`,
    );
  }

  const stops =
    params.stopOfferIds.length > 0
      ? await resolveApprovedStopOffers(params.stopOfferIds, { useAdmin: true })
      : pkg.stops;
  if (!stops.length) throw new Error("Add at least one stop to your plan");
  if (params.stopOfferIds.length > 0 && stops.length !== params.stopOfferIds.length) {
    throw new Error("One or more selected stops are unavailable");
  }

  const connect = await assertVibeVenuesConnectReady(stops);
  if (!connect.ok) throw new Error(connectGapErrorMessage(connect.gaps));

  const unitSubtotal = stops.reduce((sum, s) => sum + s.price_cents, 0);
  const commissionPct = await getNightPackageCommissionPct();
  const subtotalCents = unitSubtotal * params.partySize;
  const commissionCents = Math.round((subtotalCents * commissionPct) / 100);
  const totalCents = subtotalCents + commissionCents;
  const amounts = evenSplitCents(totalCents, payerCount);
  const inviteToken = newInviteToken();
  const expiresAt = new Date(Date.now() + GROUP_TTL_MS).toISOString();
  const stopOfferIds = stops.map((s) => s.stop_offer_id);

  const admin = createAdminClient();
  const { data: group, error } = await admin
    .from("vibe_payment_groups")
    .insert({
      package_id: params.packageId,
      host_user_id: params.hostUserId,
      party_size: params.partySize,
      starts_on: params.startsOn,
      stop_offer_ids: stopOfferIds,
      payer_count: payerCount,
      subtotal_cents: subtotalCents,
      commission_cents: commissionCents,
      total_cents: totalCents,
      status: "collecting",
      invite_token: inviteToken,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error) throw error;

  const shareRows = amounts.map((amountCents, index) => ({
    group_id: group.id,
    user_id: index === 0 ? params.hostUserId : null,
    role: index === 0 ? "host" : "guest",
    invite_label: index === 0 ? "Host" : `Guest ${index}`,
    amount_cents: amountCents,
    status: "pending",
  }));

  const { data: shares, error: shareError } = await admin
    .from("vibe_payment_shares")
    .insert(shareRows)
    .select("id");
  if (shareError) throw shareError;

  return {
    groupId: group.id as string,
    inviteToken,
    shareIds: (shares ?? []).map((s) => s.id as string),
    amounts,
    totalCents,
    expiresAt,
  };
}

export async function createSharePaymentIntent(params: {
  groupId: string;
  shareId: string;
  userId: string;
}): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}> {
  await expireGroupIfNeeded(params.groupId);
  const admin = createAdminClient();

  const { data: group } = await admin
    .from("vibe_payment_groups")
    .select("*")
    .eq("id", params.groupId)
    .maybeSingle();
  if (!group) throw new Error("Split group not found");
  if (group.status !== "collecting") {
    throw new Error(`This split is ${group.status}`);
  }
  if (new Date(group.expires_at as string).getTime() <= Date.now()) {
    await expireGroupIfNeeded(params.groupId);
    throw new Error("This split invite has expired");
  }

  const { data: share } = await admin
    .from("vibe_payment_shares")
    .select("*")
    .eq("id", params.shareId)
    .eq("group_id", params.groupId)
    .maybeSingle();
  if (!share) throw new Error("Share not found");
  if (share.status === "paid") throw new Error("This share is already paid");

  if (share.role === "host" && share.user_id !== params.userId) {
    throw new Error("Only the host can pay this share");
  }
  if (share.role === "guest") {
    if (share.user_id && share.user_id !== params.userId) {
      throw new Error("This share is claimed by someone else");
    }
    if (!share.user_id) {
      await admin
        .from("vibe_payment_shares")
        .update({
          user_id: params.userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", share.id)
        .is("user_id", null);
    }
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: Number(share.amount_cents),
    currency: "usd",
    metadata: {
      type: "vibe_payment_share",
      group_id: params.groupId,
      share_id: params.shareId,
      user_id: params.userId,
      night_package_id: group.package_id as string,
    },
    automatic_payment_methods: { enabled: true },
  });

  await admin
    .from("vibe_payment_shares")
    .update({
      stripe_payment_intent_id: intent.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", share.id);

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
    amount: Number(share.amount_cents) / 100,
  };
}

export async function confirmSharePayment(params: {
  paymentIntentId: string;
  userId: string;
}): Promise<{
  status: "share_paid" | "group_paid";
  groupId: string;
  orderId?: string | null;
}> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(params.paymentIntentId);
  if (intent.metadata.type !== "vibe_payment_share") {
    throw new Error("Invalid payment type");
  }
  if (intent.metadata.user_id !== params.userId) {
    throw new Error("Unauthorized");
  }
  if (intent.status !== "succeeded") {
    throw new Error("Payment has not completed yet");
  }

  const groupId = intent.metadata.group_id;
  const shareId = intent.metadata.share_id;
  if (!groupId || !shareId) throw new Error("Incomplete payment metadata");

  const admin = createAdminClient();
  const now = new Date().toISOString();

  await admin
    .from("vibe_payment_shares")
    .update({
      status: "paid",
      paid_at: now,
      user_id: params.userId,
      stripe_payment_intent_id: intent.id,
      updated_at: now,
    })
    .eq("id", shareId)
    .eq("group_id", groupId);

  const { data: pending } = await admin
    .from("vibe_payment_shares")
    .select("id")
    .eq("group_id", groupId)
    .neq("status", "paid");

  if (pending && pending.length > 0) {
    return { status: "share_paid", groupId };
  }

  const orderId = await finalizePaidGroup(groupId);
  return { status: "group_paid", groupId, orderId };
}

async function finalizePaidGroup(groupId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: group } = await admin
    .from("vibe_payment_groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) throw new Error("Group not found");
  if (group.status === "paid" && group.order_id) {
    return group.order_id as string;
  }
  if (group.status !== "collecting" && group.status !== "paid") {
    throw new Error(`Cannot finalize group in status ${group.status}`);
  }

  // Synthetic PI id for order uniqueness — use group id as stable key.
  const syntheticPi = `vibe_group_${groupId}`;

  const result = await recordNightPackageOrder({
    userId: group.host_user_id as string,
    packageId: group.package_id as string,
    partySize: Number(group.party_size),
    subtotalCents: Number(group.subtotal_cents),
    commissionCents: Number(group.commission_cents),
    totalCents: Number(group.total_cents),
    paymentIntentId: syntheticPi,
    status: "paid",
    stopOfferIds: (group.stop_offer_ids as string[]) ?? [],
    startsOn: group.starts_on as string,
  });

  if (result.orderId) {
    await admin
      .from("vibe_payment_groups")
      .update({
        status: "paid",
        order_id: result.orderId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId);

    if (result.created) {
      await finalizeNightPackageMarketplace(result.orderId);
    }
  }

  return result.orderId;
}

export async function getGroupByToken(token: string) {
  const admin = createAdminClient();
  const { data: group } = await admin
    .from("vibe_payment_groups")
    .select(
      `
      id, package_id, host_user_id, party_size, starts_on, payer_count,
      subtotal_cents, commission_cents, total_cents, status, expires_at,
      invite_token, order_id,
      package:night_packages(id, title, slug),
      shares:vibe_payment_shares(
        id, role, amount_cents, status, user_id, invite_label, paid_at
      )
    `,
    )
    .eq("invite_token", token)
    .maybeSingle();
  if (!group) return null;
  await expireGroupIfNeeded(group.id as string);
  if (group.status === "collecting") {
    const { data: refreshed } = await admin
      .from("vibe_payment_groups")
      .select("status")
      .eq("id", group.id)
      .maybeSingle();
    if (refreshed?.status) group.status = refreshed.status;
  }
  return group;
}

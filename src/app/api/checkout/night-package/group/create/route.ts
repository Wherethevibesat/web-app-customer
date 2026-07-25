import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createVibePaymentGroup } from "@/lib/stripe/vibe-split";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const packageId = String(body.packageId ?? "").trim();
  const startsOn = String(body.startsOn ?? "").trim();
  const partySize = Math.max(1, Math.min(50, Number(body.partySize) || 1));
  const payerCount = Math.max(2, Math.min(20, Number(body.payerCount) || 2));
  const splitMode = body.splitMode === "custom" ? "custom" : "even";
  const expiresInMinutes = Number(body.expiresInMinutes) || 1440;
  const stopOfferIds = Array.isArray(body.stopOfferIds)
    ? (body.stopOfferIds as unknown[]).map((id) => String(id).trim()).filter(Boolean)
    : [];
  const guestEmails = Array.isArray(body.guestEmails)
    ? (body.guestEmails as unknown[]).map((e) => String(e ?? "").trim())
    : [];
  const amountCents = Array.isArray(body.amountCents)
    ? (body.amountCents as unknown[]).map((n) => Number(n))
    : undefined;

  if (!packageId) {
    return NextResponse.json({ error: "packageId required" }, { status: 400 });
  }

  try {
    const group = await createVibePaymentGroup({
      hostUserId: user.id,
      hostName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split("@")[0] ??
        null,
      hostEmail: user.email ?? null,
      packageId,
      partySize,
      startsOn,
      stopOfferIds,
      payerCount,
      splitMode,
      amountCents,
      guestEmails,
      expiresInMinutes,
    });

    return NextResponse.json({
      groupId: group.groupId,
      inviteToken: group.inviteToken,
      inviteUrl: group.inviteUrl,
      shareIds: group.shareIds,
      amounts: group.amounts.map((c) => c / 100),
      amountCents: group.amounts,
      totalCents: group.totalCents,
      total: group.totalCents / 100,
      expiresAt: group.expiresAt,
      hostShareId: group.shareIds[0],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create split";
    const status =
      /Connect|unavailable|not found|Party size|start date|email|amounts|Add |Custom|Guest/i.test(
        msg,
      )
        ? 409
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createVibePaymentGroup } from "@/lib/stripe/vibe-split";
import { customerPortalUrl } from "@/lib/email/send";

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
  const stopOfferIds = Array.isArray(body.stopOfferIds)
    ? (body.stopOfferIds as unknown[]).map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (!packageId) {
    return NextResponse.json({ error: "packageId required" }, { status: 400 });
  }

  try {
    const group = await createVibePaymentGroup({
      hostUserId: user.id,
      packageId,
      partySize,
      startsOn,
      stopOfferIds,
      payerCount,
    });

    return NextResponse.json({
      groupId: group.groupId,
      inviteToken: group.inviteToken,
      inviteUrl: customerPortalUrl(`/packages/split/${group.inviteToken}`),
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
      /Connect|unavailable|not found|Party size|start date/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

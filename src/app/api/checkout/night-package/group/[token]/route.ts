import { NextResponse } from "next/server";
import { getGroupByToken } from "@/lib/stripe/vibe-split";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const group = await getGroupByToken(token);
  if (!group) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const pkg = group.package as { id?: string; title?: string; slug?: string } | null;
  const shares = (group.shares as Array<{
    id: string;
    role: string;
    amount_cents: number;
    status: string;
    user_id: string | null;
    invite_label: string | null;
  }>) ?? [];

  return NextResponse.json({
    id: group.id,
    status: group.status,
    packageId: group.package_id,
    packageTitle: pkg?.title ?? "Curated vibe",
    packageSlug: pkg?.slug ?? null,
    partySize: group.party_size,
    startsOn: group.starts_on,
    payerCount: group.payer_count,
    subtotal: Number(group.subtotal_cents) / 100,
    commission: Number(group.commission_cents) / 100,
    total: Number(group.total_cents) / 100,
    expiresAt: group.expires_at,
    orderId: group.order_id,
    shares: shares.map((s) => ({
      id: s.id,
      role: s.role,
      amount: s.amount_cents / 100,
      amountCents: s.amount_cents,
      status: s.status,
      userId: s.user_id,
      label: s.invite_label,
    })),
    paidCount: shares.filter((s) => s.status === "paid").length,
    openGuestShareId:
      shares.find((s) => s.role === "guest" && s.status === "pending" && !s.user_id)
        ?.id ??
      shares.find((s) => s.role === "guest" && s.status === "pending")?.id ??
      null,
  });
}

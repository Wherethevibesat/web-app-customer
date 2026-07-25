import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { buildMobilePayUrl } from "@/lib/stripe/mobile-pay-token";
import { createSharePaymentIntent } from "@/lib/stripe/vibe-split";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId ?? "").trim();
  const shareId = String(body.shareId ?? "").trim();
  if (!groupId || !shareId) {
    return NextResponse.json(
      { error: "groupId and shareId required" },
      { status: 400 },
    );
  }

  try {
    const intent = await createSharePaymentIntent({
      groupId,
      shareId,
      userId: user.id,
      userEmail: user.email ?? null,
    });
    const amountLabel = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: intent.amount % 1 === 0 ? 0 : 2,
    }).format(intent.amount);

    const mobilePayUrl = buildMobilePayUrl({
      clientSecret: intent.clientSecret,
      paymentIntentId: intent.paymentIntentId,
      userId: user.id,
      kind: "vibe_share",
      amountLabel,
    });

    return NextResponse.json({ ...intent, mobilePayUrl, amountLabel });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not start share payment";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}

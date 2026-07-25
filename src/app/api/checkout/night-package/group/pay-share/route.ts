import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
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
    return NextResponse.json(intent);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not start share payment";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}

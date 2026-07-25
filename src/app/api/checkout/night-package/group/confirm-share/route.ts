import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { confirmSharePayment } from "@/lib/stripe/vibe-split";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const paymentIntentId = String(body.paymentIntentId ?? "").trim();
  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "paymentIntentId required" },
      { status: 400 },
    );
  }

  try {
    const result = await confirmSharePayment({
      paymentIntentId,
      userId: user.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Confirmation failed";
    const pending = /has not completed/i.test(msg);
    return NextResponse.json(
      { error: msg, status: pending ? "pending" : "error" },
      { status: pending ? 200 : 409 },
    );
  }
}

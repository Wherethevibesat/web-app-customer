import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isIsoDateOnOrAfterToday } from "@/lib/event-dates";
import { createVibeBookingRequest } from "@/lib/data/vibe-request-book";

export async function POST(request: Request) {
  const { user } = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json();
  const packageId = body.packageId as string | undefined;
  const startsOn = String(body.startsOn ?? "").trim();
  const partySize = Math.max(1, Math.min(50, Number(body.partySize) || 1));
  const requestedStopIds = Array.isArray(body.stopOfferIds)
    ? (body.stopOfferIds as unknown[])
        .map((id) => String(id).trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  if (!packageId) {
    return NextResponse.json({ error: "packageId required" }, { status: 400 });
  }

  if (!isIsoDateOnOrAfterToday(startsOn)) {
    return NextResponse.json(
      { error: "Pick a start date (today or later)" },
      { status: 400 },
    );
  }

  if (!requestedStopIds.length) {
    return NextResponse.json({ error: "Add at least one stop to your plan" }, { status: 400 });
  }

  try {
    const result = await createVibeBookingRequest({
      userId: user.id,
      packageId,
      partySize,
      startsOn,
      stopOfferIds: requestedStopIds,
      guestEmail: user.email ?? null,
      guestName:
        (typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null) ||
        (typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null),
    });

    return NextResponse.json({
      orderId: result.orderId,
      expiresAt: result.expiresAt,
      confirmationCode: result.confirmationCode,
      status: "requested",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    const status =
      msg.includes("instant checkout") || msg.includes("unavailable")
        ? 409
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

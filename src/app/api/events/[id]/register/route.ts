import { NextResponse } from "next/server";
import { createFreeRegistration } from "@/lib/data/event-tickets";
import { requireUser } from "@/lib/auth/require-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const { user } = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { tierId } = await request.json();
  if (!tierId) return NextResponse.json({ error: "tierId required" }, { status: 400 });

  try {
    const registrationId = await createFreeRegistration({
      userId: user.id,
      eventId,
      tierId,
    });
    return NextResponse.json({ registrationId, status: "confirmed" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

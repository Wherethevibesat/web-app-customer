import { createAdminClient } from "@/lib/supabase/admin";
import { notifyVenueNewVibeBooking } from "@/lib/email/vibe-notifications";
import { sendFcmToUser } from "@/lib/push/fcm";
import { formatVibeStartLabel } from "@/lib/event-dates";

export async function sendVibeBookingVenueNotifications(
  orderId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("night_package_orders")
    .select(
      `
      id, party_size, starts_on,
      package:night_packages(title),
      stops:night_package_order_stops(
        id, venue_id, title, redemption_code, venue_payout_cents, party_size
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;

  const packageTitle =
    order.package && typeof order.package === "object" && !Array.isArray(order.package)
      ? ((order.package as { title?: string }).title ?? "Curated vibe")
      : "Curated vibe";

  const startsOnLabel =
    typeof order.starts_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(order.starts_on)
      ? formatVibeStartLabel(order.starts_on as `${number}-${number}-${number}`)
      : null;

  const stops = (order.stops as Array<{
    venue_id: string;
    title: string;
    redemption_code: string;
    venue_payout_cents: number;
    party_size: number;
  }>) ?? [];

  const venueIds = [...new Set(stops.map((s) => s.venue_id))];
  if (!venueIds.length) return;

  const { data: venues } = await admin
    .from("venues")
    .select("id, name, owner_id")
    .in("id", venueIds);

  const ownerIds = [
    ...new Set(
      (venues ?? [])
        .map((v) => v.owner_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const { data: owners } = ownerIds.length
    ? await admin.from("users").select("id, email, name").in("id", ownerIds)
    : { data: [] as Array<{ id: string; email: string; name: string }> };

  const ownerById = new Map(
    (owners ?? []).map((o) => [
      o.id as string,
      { email: o.email as string, name: (o.name as string) || "there" },
    ]),
  );
  const venueById = new Map(
    (venues ?? []).map((v) => [
      v.id as string,
      {
        name: (v.name as string) || "Venue",
        ownerId: v.owner_id as string | null,
      },
    ]),
  );

  const notifiedOwners = new Set<string>();

  for (const stop of stops) {
    const venue = venueById.get(stop.venue_id);
    if (!venue?.ownerId) continue;
    const owner = ownerById.get(venue.ownerId);
    if (!owner?.email) continue;

    notifyVenueNewVibeBooking({
      venueOwnerEmail: owner.email,
      venueOwnerName: owner.name,
      venueName: venue.name,
      packageTitle,
      offerTitle: stop.title,
      startsOnLabel,
      partySize: stop.party_size || Number(order.party_size) || 1,
      redemptionCode: stop.redemption_code,
      payoutCents: Number(stop.venue_payout_cents) || 0,
    });

    if (!notifiedOwners.has(venue.ownerId)) {
      notifiedOwners.add(venue.ownerId);
      void sendFcmToUser({
        userId: venue.ownerId,
        title: "New vibe booking",
        body: `${stop.title} · code ${stop.redemption_code}`,
        data: {
          type: "vibe_booking",
          order_id: orderId,
          path: "/vibe-bookings",
        },
      }).catch((err) => console.error("[vibe] FCM failed", err));
    }
  }
}

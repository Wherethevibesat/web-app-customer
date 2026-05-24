import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EventTicketTier = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  capacity: number | null;
  sort_order: number;
};

export async function listEventTicketTiers(eventId: string): Promise<EventTicketTier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_ticket_tiers")
    .select("id, event_id, name, description, price_cents, capacity, sort_order")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as EventTicketTier[];
}

export async function getTicketTier(tierId: string): Promise<EventTicketTier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_ticket_tiers")
    .select("id, event_id, name, description, price_cents, capacity, sort_order")
    .eq("id", tierId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) return null;
  return data as EventTicketTier | null;
}

export async function tierSoldCount(tierId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("tier_id", tierId)
    .eq("status", "confirmed");
  if (error) return 0;
  return count ?? 0;
}

export async function userRegistrationForEvent(userId: string, eventId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("id, tier_id, status, event_ticket_tiers(name, price_cents)")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .maybeSingle();
  return data;
}

export async function createFreeRegistration(params: {
  userId: string;
  eventId: string;
  tierId: string;
}) {
  const tier = await getTicketTier(params.tierId);
  if (!tier || tier.event_id !== params.eventId) {
    throw new Error("Ticket tier not found");
  }
  if (tier.price_cents > 0) {
    throw new Error("This tier requires payment");
  }
  const sold = await tierSoldCount(params.tierId);
  if (tier.capacity != null && sold >= tier.capacity) {
    throw new Error("This tier is sold out");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("event_registrations")
    .insert({
      event_id: params.eventId,
      tier_id: params.tierId,
      user_id: params.userId,
      status: "confirmed",
      quantity: 1,
      amount_cents: 0,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("You are already registered for this event");
    throw error;
  }
  return data.id as string;
}

import type { SupabaseClient } from "@supabase/supabase-js";

export type CustomerVibeOrderStop = {
  id: string;
  title: string;
  venue_id: string | null;
  scheduled_label: string | null;
  redemption_code: string;
  status: string;
  sort_order: number;
  line_total_cents: number | null;
  stop_offer_id: string;
  venue: { name: string } | { name: string }[] | null;
};

export type CustomerVibeOrder = {
  id: string;
  confirmation_code: string;
  party_size: number;
  starts_on: string | null;
  total_cents: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  expires_at: string | null;
  package:
    | { id: string; title: string; slug: string | null }
    | { id: string; title: string; slug: string | null }[]
    | null;
  stops: CustomerVibeOrderStop[] | null;
};

const ORDER_SELECT_FULL = `
  id, confirmation_code, party_size, starts_on, total_cents, status, paid_at, created_at, expires_at,
  package:night_packages(id, title, slug),
  stops:night_package_order_stops(
    id, title, venue_id, scheduled_label, redemption_code, status, sort_order,
    line_total_cents, stop_offer_id,
    venue:venues(name)
  )
`;

const ORDER_SELECT_FALLBACK = `
  id, confirmation_code, party_size, starts_on, total_cents, status, paid_at, created_at,
  package:night_packages(id, title, slug),
  stops:night_package_order_stops(
    id, title, venue_id, scheduled_label, redemption_code, status, sort_order,
    line_total_cents, stop_offer_id,
    venue:venues(name)
  )
`;

/** Customer My Plans — includes requested / awaiting_payment / paid / expired. */
export async function listCustomerVibeOrders(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ orders: CustomerVibeOrder[]; error: string | null }> {
  const primary = await supabase
    .from("night_package_orders")
    .select(ORDER_SELECT_FULL)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!primary.error) {
    return {
      orders: (primary.data as CustomerVibeOrder[] | null) ?? [],
      error: null,
    };
  }

  // Schema lag (e.g. expires_at not migrated yet) — still show plans.
  const fallback = await supabase
    .from("night_package_orders")
    .select(ORDER_SELECT_FALLBACK)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (fallback.error) {
    return {
      orders: [],
      error: fallback.error.message || primary.error.message,
    };
  }

  return {
    orders: ((fallback.data as CustomerVibeOrder[] | null) ?? []).map((o) => ({
      ...o,
      expires_at: o.expires_at ?? null,
    })),
    error: null,
  };
}

export function vibeOrderPackage(
  order: CustomerVibeOrder,
): { id: string; title: string; slug: string | null } | null {
  const pkg = order.package;
  if (!pkg) return null;
  return Array.isArray(pkg) ? pkg[0] ?? null : pkg;
}

export function vibeOrderStatusLabel(status: string) {
  switch (status) {
    case "requested":
      return "Waiting on venues";
    case "awaiting_payment":
      return "Ready to pay";
    case "expired":
      return "Request expired";
    case "cancelled":
      return "Cancelled";
    case "paid":
      return "Booked";
    default:
      return status;
  }
}

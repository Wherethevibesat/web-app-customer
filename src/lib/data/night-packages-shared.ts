/** Client-safe types/helpers (no next/headers / Supabase server imports). */

export type ApprovedStopOffer = {
  id: string;
  title: string;
  description: string;
  slot_type: string;
  price_cents: number;
  inclusions: string[];
  arrival_window: string | null;
  image_url: string | null;
  venue: { id: string; name: string } | null;
};

export type PackageCard = {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string;
  image_url: string | null;
  is_featured: boolean;
  subtotal_cents: number;
  stopChain: string;
  stopCount: number;
};

export function slotTypeLabel(slot: string) {
  return slot.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Guest pays stop subtotal + service fee (platform commission). */
export function nightPackageTotals(params: {
  unitSubtotalCents: number;
  partySize: number;
  commissionPct: number;
}) {
  const partySize = Math.max(1, params.partySize);
  const subtotalCents = params.unitSubtotalCents * partySize;
  const pct = Math.max(0, Math.min(100, params.commissionPct));
  const serviceFeeCents = Math.round((subtotalCents * pct) / 100);
  const totalCents = subtotalCents + serviceFeeCents;
  return { subtotalCents, serviceFeeCents, totalCents, commissionPct: pct };
}

export function toPackageCard(pkg: {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string;
  image_url: string | null;
  is_featured: boolean;
  subtotal_cents?: number;
  stops?: {
    stop_offer: { slot_type: string } | null;
  }[];
}): PackageCard {
  const stops = pkg.stops ?? [];
  const chain = stops
    .map((s) => (s.stop_offer ? slotTypeLabel(s.stop_offer.slot_type) : null))
    .filter(Boolean)
    .join(" → ");
  return {
    id: pkg.id,
    slug: pkg.slug,
    title: pkg.title,
    subtitle: pkg.subtitle,
    image_url: pkg.image_url,
    is_featured: pkg.is_featured,
    subtotal_cents: pkg.subtotal_cents ?? 0,
    stopChain: chain,
    stopCount: stops.length,
  };
}

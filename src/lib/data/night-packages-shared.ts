/** Client-safe types/helpers (no next/headers / Supabase server imports). */

/** Anchor package for DIY / random checkouts (seeded in migration 048). */
export const DIY_VIBE_SLUG = "build-your-own";
export const DIY_VIBE_ID = "a0000000-0000-4000-8000-0000000000d1";

export type ApprovedStopOffer = {
  id: string;
  title: string;
  description: string;
  slot_type: string;
  price_cents: number;
  inclusions: string[];
  arrival_window: string | null;
  image_url: string | null;
  why_picked?: string;
  duration_label?: string | null;
  dress_code?: string | null;
  crowd_label?: string | null;
  venue: { id: string; name: string } | null;
};

/** Browse card for Curated Vibes (no price on card). */
export type PackageCard = {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string;
  tagline: string;
  image_url: string | null;
  is_featured: boolean;
  subtotal_cents: number;
  stopChain: string;
  stopCount: number;
  vibe_tags: string[];
  template_key: string | null;
  rating: number | null;
  groups_booked: number | null;
};

/** Match occasion entry points (`?vibe=date_night`) to published vibes. */
export function matchesOccasionVibe(
  pkg: {
    template_key?: string | null;
    title?: string;
    vibe_tags?: string[] | null;
    slug?: string | null;
  },
  vibeKey: string,
): boolean {
  const tags = (pkg.vibe_tags ?? []).map((t) => t.toLowerCase());
  const title = (pkg.title ?? "").toLowerCase();
  const slug = (pkg.slug ?? "").toLowerCase();
  const template = (pkg.template_key ?? "").toLowerCase();

  switch (vibeKey) {
    case "date_night":
      return (
        template === "date_night" ||
        tags.some((t) => t.includes("date")) ||
        title.includes("date night")
      );
    case "girls_night":
      return (
        tags.some((t) => t.includes("girl") || t.includes("ladies")) ||
        title.includes("girls") ||
        slug.includes("girls")
      );
    case "birthday":
      return (
        template === "birthday" ||
        tags.some((t) => t.includes("birthday") || t.includes("bday")) ||
        title.includes("birthday")
      );
    case "out_of_town":
      return (
        template === "out_of_town" ||
        tags.some((t) => t.includes("visitor") || t.includes("weekend")) ||
        title.includes("out of town") ||
        slug.includes("rooftop-escape") ||
        slug.includes("out-of-town")
      );
    case "luxury":
      return (
        tags.some((t) => t.includes("luxury") || t.includes("vip")) ||
        title.includes("luxury") ||
        template === "lit_night"
      );
    default:
      return template === vibeKey;
  }
}

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

export function savingsCents(params: {
  diyCompareCents: number | null | undefined;
  subtotalCents: number;
}): number | null {
  const diy = params.diyCompareCents;
  if (diy == null || diy <= params.subtotalCents) return null;
  return diy - params.subtotalCents;
}

export function toPackageCard(pkg: {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string;
  tagline?: string | null;
  image_url: string | null;
  is_featured: boolean;
  subtotal_cents?: number;
  vibe_tags?: string[] | null;
  template_key?: string | null;
  rating?: number | null;
  groups_booked?: number | null;
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
    tagline: (pkg.tagline ?? "").trim() || pkg.subtitle,
    image_url: pkg.image_url,
    is_featured: pkg.is_featured,
    subtotal_cents: pkg.subtotal_cents ?? 0,
    stopChain: chain,
    stopCount: stops.length,
    vibe_tags: pkg.vibe_tags ?? [],
    template_key: pkg.template_key ?? null,
    rating: pkg.rating ?? null,
    groups_booked: pkg.groups_booked ?? null,
  };
}

import type { Venue } from "@/lib/data/venues";

/** Venue feed category labels — parity with Flutter `MockDiscoverData.categories`. */
export const VENUE_CATEGORIES = [
  "Nearest",
  "Bars",
  "Night clubs",
  "Restaurants",
  "Location",
] as const;

export type VenueCategory = (typeof VENUE_CATEGORIES)[number];

export function filterVenuesByCategory(
  venues: Venue[],
  categoryIndex: number,
): Venue[] {
  const label = VENUE_CATEGORIES[categoryIndex] ?? "Nearest";
  switch (label) {
    case "Bars":
      return venues.filter((v) => /bar/i.test(v.venue_type));
    case "Night clubs":
      return venues.filter((v) => /club|nightlife|night/i.test(v.venue_type));
    case "Restaurants":
      return venues.filter((v) => /restaurant|dining|food/i.test(v.venue_type));
    case "Nearest":
    default:
      return venues;
  }
}

export type City = {
  slug: string;
  name: string;
  state: string;
  /** Live cities have full content; others show a "coming soon" page. */
  live: boolean;
};

/**
 * Single source of truth for the cities WTVA operates in (or is expanding to).
 * To launch a new market, flip `live` to true. To add a market, append here.
 */
export const CITIES: City[] = [
  { slug: "houston", name: "Houston", state: "TX", live: true },
  { slug: "dallas", name: "Dallas", state: "TX", live: false },
  { slug: "atlanta", name: "Atlanta", state: "GA", live: false },
  { slug: "miami", name: "Miami", state: "FL", live: false },
  { slug: "washington-dc", name: "Washington", state: "DC", live: false },
  { slug: "baltimore", name: "Baltimore", state: "MD", live: false },
  { slug: "chicago", name: "Chicago", state: "IL", live: false },
  { slug: "charlotte", name: "Charlotte", state: "NC", live: false },
  { slug: "new-orleans", name: "New Orleans", state: "LA", live: false },
  { slug: "las-vegas", name: "Las Vegas", state: "NV", live: false },
  { slug: "new-york", name: "New York", state: "NY", live: false },
  { slug: "los-angeles", name: "Los Angeles", state: "CA", live: false },
];

export const DEFAULT_CITY: City = CITIES.find((c) => c.live) ?? CITIES[0];

export const LIVE_CITIES = CITIES.filter((c) => c.live);
export const COMING_SOON_CITIES = CITIES.filter((c) => !c.live);

export function getCity(slug: string | null | undefined): City | undefined {
  if (!slug) return undefined;
  return CITIES.find((c) => c.slug === slug.toLowerCase());
}

/** "Washington, DC" */
export function cityLabel(city: City): string {
  return `${city.name}, ${city.state}`;
}

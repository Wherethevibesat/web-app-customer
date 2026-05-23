import { eventTypeFromSlug, eventTypeToSlug } from "@/lib/event-types";

export type BrowseFilters = {
  type?: string;
  neighborhood?: string;
  featured?: boolean;
  q?: string;
};

export function buildBrowseUrl(basePath: string, filters: BrowseFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.type) params.set("type", eventTypeToSlug(filters.type));
  if (filters.neighborhood) params.set("neighborhood", filters.neighborhood);
  if (filters.featured) params.set("featured", "1");

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function parseBrowseFilters(searchParams: {
  type?: string;
  neighborhood?: string;
  featured?: string;
  q?: string;
}): BrowseFilters {
  const typeSlug = searchParams.type?.trim();
  const neighborhoodSlug = searchParams.neighborhood?.trim();
  const q = searchParams.q?.trim();

  return {
    type: typeSlug ? (eventTypeFromSlug(typeSlug) ?? typeSlug) : undefined,
    neighborhood: neighborhoodSlug || undefined,
    featured: searchParams.featured === "1",
    q: q || undefined,
  };
}

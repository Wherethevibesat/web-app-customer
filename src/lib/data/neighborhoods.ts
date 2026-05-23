import { listVenues, type Venue } from "@/lib/data/venues";
import { createClient } from "@/lib/supabase/server";

export interface NeighborhoodGroup {
  name: string;
  slug: string;
  description?: string | null;
  venues: Venue[];
}

export type PublicNeighborhood = {
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

const DEFAULT_CITY = "Houston";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function listPublicNeighborhoods(city = DEFAULT_CITY): Promise<PublicNeighborhood[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("name, slug, description, sort_order")
    .eq("city", city)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PublicNeighborhood[];
}

function venuesForNeighborhood(venues: Venue[], neighborhoodName: string): Venue[] {
  const target = neighborhoodName.toLowerCase();
  return venues.filter((v) => (v.neighborhood ?? "").toLowerCase() === target);
}

/** Admin-defined neighborhoods with matching venues (falls back to venue grouping if table missing). */
export async function listNeighborhoodGroups(): Promise<NeighborhoodGroup[]> {
  const venues = await listVenues().catch(() => []);

  try {
    const rows = await listPublicNeighborhoods();
    if (rows.length > 0) {
      return rows.map((row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description,
        venues: venuesForNeighborhood(venues, row.name),
      }));
    }
  } catch {
    // fall through
  }

  const map = new Map<string, Venue[]>();
  for (const v of venues) {
    const n = v.neighborhood?.trim() || "Other";
    const list = map.get(n) ?? [];
    list.push(v);
    map.set(n, list);
  }

  return [...map.entries()]
    .map(([name, vs]) => ({
      name,
      slug: slugify(name),
      venues: vs,
    }))
    .sort((a, b) => b.venues.length - a.venues.length);
}

export async function getNeighborhoodBySlug(slug: string): Promise<NeighborhoodGroup | null> {
  const groups = await listNeighborhoodGroups();
  return groups.find((g) => g.slug === slug) ?? null;
}

export async function listNeighborhoodNames(): Promise<string[]> {
  try {
    const rows = await listPublicNeighborhoods();
    if (rows.length > 0) return rows.map((r) => r.name);
  } catch {
    // fall through
  }
  const groups = await listNeighborhoodGroups();
  return groups.map((g) => g.name);
}

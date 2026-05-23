import Link from "next/link";
import { BrowseFiltersBar } from "@/components/browse-filters";
import { VenueCard } from "@/components/venue-card";
import {
  listNeighborhoodOptions,
  resolveNeighborhoodName,
} from "@/lib/data/neighborhoods";
import { parseBrowseFilters } from "@/lib/filter-url";
import { listVenues } from "@/lib/data/venues";

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; neighborhood?: string }>;
}) {
  const raw = await searchParams;
  const filters = parseBrowseFilters(raw);
  const neighborhoodName = await resolveNeighborhoodName(filters.neighborhood);

  const [venues, neighborhoods] = await Promise.all([
    listVenues({
      search: filters.q,
      neighborhood: neighborhoodName,
    }).catch(() => []),
    listNeighborhoodOptions().catch(() => []),
  ]);

  const featured = venues.filter((v) => v.featured);
  const rest = venues.filter((v) => !v.featured);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Venues</h1>
      <p className="mt-2 max-w-2xl text-wtva-muted">
        Clubs, lounges, and nightlife spots. Filter by neighborhood or search by name.
      </p>

      <div className="mt-8">
        <BrowseFiltersBar
          basePath="/venues"
          filters={{ neighborhood: filters.neighborhood, q: filters.q }}
          neighborhoods={neighborhoods}
          showSearch
          showEventTypes={false}
        />
      </div>

      {neighborhoodName && (
        <p className="mt-6 text-sm text-wtva-muted">
          {venues.length} venue{venues.length === 1 ? "" : "s"} in {neighborhoodName}
        </p>
      )}

      {featured.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-wtva-muted">
            Featured
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        {featured.length > 0 && (
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-wtva-muted">
            All venues
          </h2>
        )}
        {rest.length > 0 || featured.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(featured.length ? rest : venues).map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-wtva-dark-300 py-20 text-center text-wtva-muted">
            No venues found.{" "}
            <Link href="/venues" className="underline">
              Clear filters
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

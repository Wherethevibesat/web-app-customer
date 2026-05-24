import Link from "next/link";
import { BrowseFiltersBar } from "@/components/browse-filters";
import { EventCard } from "@/components/event-card";
import { VenueCard } from "@/components/venue-card";
import { getEventTypes, searchEvents } from "@/lib/data/events";
import {
  listNeighborhoodOptions,
  resolveNeighborhoodName,
} from "@/lib/data/neighborhoods";
import { parseBrowseFilters } from "@/lib/filter-url";
import { listVenues } from "@/lib/data/venues";

type SearchBrowseViewProps = {
  basePath?: string;
  searchParams: Promise<{ q?: string; type?: string; neighborhood?: string }>;
};

export async function SearchBrowseView({
  basePath = "/discover/search",
  searchParams,
}: SearchBrowseViewProps) {
  const raw = await searchParams;
  const filters = parseBrowseFilters(raw);
  const neighborhoodName = await resolveNeighborhoodName(filters.neighborhoods?.[0]);
  const query = filters.q?.trim() ?? "";
  const hasFilters = Boolean(query || filters.type || neighborhoodName);

  const [events, allVenues, types, neighborhoods] = await Promise.all([
    hasFilters
      ? searchEvents(query, {
          eventType: filters.type,
          neighborhood: neighborhoodName,
          limit: 40,
        })
      : Promise.resolve([]),
    hasFilters
      ? listVenues({
          search: query || undefined,
          neighborhood: neighborhoodName,
        }).catch(() => [])
      : Promise.resolve([]),
    getEventTypes().catch(() => []),
    listNeighborhoodOptions().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-bold">Search</h1>
      <p className="mt-2 text-wtva-muted">
        Find events and venues by keyword, event type, or neighborhood.
      </p>

      <div className="mt-6">
        <BrowseFiltersBar
          basePath={basePath}
          filters={filters}
          neighborhoods={neighborhoods}
          eventTypes={types}
          showSearch
        />
      </div>

      {!hasFilters && (
        <p className="mt-12 text-wtva-muted">
          Try &quot;day party&quot;, a neighborhood like Midtown, or a venue name.
        </p>
      )}

      {hasFilters && (
        <div className="mt-12 space-y-14">
          <section>
            <h2 className="text-lg font-semibold">
              Events <span className="text-wtva-muted">({events.length})</span>
            </h2>
            {events.length > 0 ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-wtva-muted">No events matched.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              Venues <span className="text-wtva-muted">({allVenues.length})</span>
            </h2>
            {allVenues.length > 0 ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {allVenues.map((v) => (
                  <VenueCard key={v.id} venue={v} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-wtva-muted">No venues matched.</p>
            )}
          </section>

          {events.length === 0 && allVenues.length === 0 && (
            <p className="py-8 text-center text-wtva-muted">
              Nothing found.{" "}
              <Link href="/discover/events" className="underline">
                Browse all events
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

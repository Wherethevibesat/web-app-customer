import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { VenueCard } from "@/components/venue-card";
import { searchEvents } from "@/lib/data/events";
import { listVenues } from "@/lib/data/venues";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [events, allVenues] = await Promise.all([
    query ? searchEvents(query) : Promise.resolve([]),
    query ? listVenues(query).catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-bold">Search</h1>
      <form className="mt-6 max-w-2xl" method="get">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Events, venues, neighborhoods…"
            className="flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            Search
          </button>
        </div>
      </form>

      {!query && (
        <p className="mt-12 text-wtva-muted">
          Try &quot;party&quot;, a neighborhood, or a venue name.
        </p>
      )}

      {query && (
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
            <p className="text-center text-wtva-muted py-8">
              Nothing found for &quot;{query}&quot;.{" "}
              <Link href="/events" className="underline">
                Browse all events
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

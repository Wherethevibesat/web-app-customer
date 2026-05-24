import Link from "next/link";
import { notFound } from "next/navigation";
import { BrowseFiltersBar } from "@/components/browse-filters";
import { EventCard } from "@/components/event-card";
import { PageShell } from "@/components/page-shell";
import { VenueCard } from "@/components/venue-card";
import {
  filterEventsClient,
  getEventTypes,
  listPublishedEvents,
} from "@/lib/data/events";
import {
  getNeighborhoodBySlug,
  listNeighborhoodOptions,
} from "@/lib/data/neighborhoods";
import { buildBrowseUrl, parseBrowseFilters } from "@/lib/filter-url";

export default async function DiscoverNeighborhoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const filters = parseBrowseFilters({ ...raw, neighborhood: slug });
  const group = await getNeighborhoodBySlug(slug);
  if (!group) notFound();

  const basePath = `/discover/neighborhoods/${slug}`;

  const [events, types, neighborhoods] = await Promise.all([
    listPublishedEvents({
      neighborhood: group.name,
      eventType: filters.type,
      limit: 24,
    }).catch(() => []),
    getEventTypes().catch(() => []),
    listNeighborhoodOptions().catch(() => []),
  ]);

  const filtered = filters.q
    ? filterEventsClient(events, { q: filters.q })
    : events;

  return (
    <PageShell
      title={group.name}
      subtitle={`${group.venues.length} venues · ${filtered.length} upcoming events`}
      backHref="/discover/map"
      backLabel="Map & areas"
      width="wide"
    >
      <BrowseFiltersBar
        basePath={basePath}
        filters={filters}
        neighborhoods={neighborhoods}
        eventTypes={types}
        showSearch
      />

      {filtered.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Upcoming events</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
          <p className="mt-4 text-sm text-wtva-muted">
            <Link
              href={buildBrowseUrl("/discover/events", {
                neighborhoods: [slug],
                type: filters.type,
              })}
              className="underline"
            >
              View all events in {group.name}
            </Link>
          </p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Venues</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {group.venues.map((v) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

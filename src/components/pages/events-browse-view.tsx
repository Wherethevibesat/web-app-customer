import Link from "next/link";
import { BrowseFiltersBar } from "@/components/browse-filters";
import { BrowseEventCard } from "@/components/browse-event-card";
import { browseItemKey, filterBrowseFeed, listBrowseFeed } from "@/lib/browse-events";
import { getEventTypes } from "@/lib/data/events";
import {
  listNeighborhoodOptions,
  resolveNeighborhoodNames,
} from "@/lib/data/neighborhoods";
import { parseBrowseFilters } from "@/lib/filter-url";
import { weekdayShortLabel } from "@/lib/weekdays";
import { formatEventDateLabel } from "@/lib/event-dates";

type EventsBrowseViewProps = {
  basePath?: string;
  searchParams: Promise<{
    type?: string;
    neighborhood?: string | string[];
    featured?: string;
    q?: string;
    day?: string | string[];
    date?: string | string[];
  }>;
};

export async function EventsBrowseView({
  basePath = "/discover/events",
  searchParams,
}: EventsBrowseViewProps) {
  const raw = await searchParams;
  const filters = parseBrowseFilters(raw);
  const neighborhoodNames = await resolveNeighborhoodNames(filters.neighborhoods);

  const [items, types, neighborhoods] = await Promise.all([
    listBrowseFeed({
      eventType: filters.type,
      neighborhoods: neighborhoodNames.length ? neighborhoodNames : undefined,
      featuredOnly: filters.featured,
      upcomingOnly: true,
      limit: 120,
    }).catch(() => []),
    getEventTypes().catch(() => []),
    listNeighborhoodOptions().catch(() => []),
  ]);

  const filtered = filterBrowseFeed(items, {
    q: filters.q,
    days: filters.days,
    date: filters.date,
  });

  const neighborhoodLabelBySlug = new Map(
    neighborhoods.map((n) => [n.slug, n.name]),
  );

  const activeLabels = [
    filters.type,
    ...(filters.days?.map((day) => weekdayShortLabel(day)) ?? []),
    ...(filters.date ? [formatEventDateLabel(filters.date)] : []),
    ...(filters.neighborhoods?.map(
      (slug) => neighborhoodLabelBySlug.get(slug) ?? slug,
    ) ?? []),
    filters.featured ? "Featured" : null,
    filters.q ? `"${filters.q}"` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Events</h1>
      <p className="mt-2 max-w-2xl text-wtva-muted">
        Parties, concerts, and nightlife happening soon. Filter by type, day, neighborhood, or search.
      </p>

      <div className="mt-8">
        <BrowseFiltersBar
          basePath={basePath}
          filters={filters}
          neighborhoods={neighborhoods}
          eventTypes={types}
          showFeatured
          showSearch
          showDayOfWeek
          showDatePicker
        />
      </div>

      {activeLabels.length > 0 && (
        <p className="mt-6 text-sm text-wtva-muted">
          Showing {filtered.length} upcoming event{filtered.length === 1 ? "" : "s"}
          {activeLabels.length > 0 ? ` · ${activeLabels.join(" · ")}` : ""}
        </p>
      )}

      {filtered.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <BrowseEventCard key={browseItemKey(item)} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-xl border border-dashed border-wtva-dark-300 py-20 text-center text-wtva-muted">
          No events match this filter.{" "}
          <Link href={basePath} className="underline">
            View all events
          </Link>
        </p>
      )}
    </div>
  );
}

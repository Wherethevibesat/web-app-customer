import { Suspense } from "react";
import { DiscoverPageClient } from "@/components/discover/discover-page-client";
import { getEventTypes } from "@/lib/data/events";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { listVenues } from "@/lib/data/venues";
import { parseBrowseFilters } from "@/lib/filter-url";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    neighborhood?: string | string[];
    featured?: string;
    q?: string;
    day?: string | string[];
    date?: string | string[];
    section?: string;
  }>;
}) {
  const raw = await searchParams;
  const filters = parseBrowseFilters(raw);

  const [venues, neighborhoods, eventTypes] = await Promise.all([
    listVenues().catch(() => []),
    listNeighborhoodOptions().catch(() => []),
    getEventTypes().catch(() => []),
  ]);

  return (
    <Suspense fallback={<div className="px-4 py-10 text-wtva-muted">Loading…</div>}>
      <DiscoverPageClient
        venues={venues}
        neighborhoods={neighborhoods}
        eventTypes={eventTypes}
        filters={filters}
      />
    </Suspense>
  );
}

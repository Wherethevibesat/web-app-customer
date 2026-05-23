"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import {
  DiscoverBrowsePanel,
  type NeighborhoodOption,
} from "@/components/discover/discover-browse-panel";
import { DiscoverQuickBrowse } from "@/components/discover/discover-quick-browse";
import { DiscoverSearchBar } from "@/components/discover/discover-search-bar";
import { useDiscoverBrowse } from "@/components/discover/use-discover-browse";
import { VenueCategoryChips } from "@/components/discover/venue-category-chips";
import { VenueCard } from "@/components/venue-card";
import { filterVenuesByCategory } from "@/lib/discover-categories";
import type { Venue } from "@/lib/data/venues";

type DiscoverPageClientProps = {
  venues: Venue[];
  neighborhoods: NeighborhoodOption[];
};

export function DiscoverPageClient({
  venues,
  neighborhoods,
}: DiscoverPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { open, initialSection, openBrowse, closeBrowse } = useDiscoverBrowse();
  const [categoryIndex, setCategoryIndex] = useState(0);
  const city = "Houston, TX";

  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "areas" || section === "events") {
      openBrowse(section);
    }
  }, [searchParams, openBrowse]);

  const filteredVenues = useMemo(
    () => filterVenuesByCategory(venues, categoryIndex),
    [venues, categoryIndex],
  );

  const promoted = venues.find((v) => v.featured) ?? venues[0];

  function handleLocationSelect() {
    setCategoryIndex(0);
    router.push("/discover/map");
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Discover</h1>
          <button
            type="button"
            className="mt-1 flex items-center gap-1 text-sm font-semibold text-wtva-muted"
            aria-label="City"
          >
            <MapPin className="h-4 w-4" />
            {city}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <DiscoverSearchBar onFilterOpen={() => openBrowse()} />
          <DiscoverQuickBrowse onAreasClick={() => openBrowse("areas")} />
          <VenueCategoryChips
            selectedIndex={categoryIndex}
            onSelect={setCategoryIndex}
            onLocationSelect={handleLocationSelect}
          />
        </div>

        {promoted && (
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Promoted</h2>
              <Link
                href="/discover/events"
                className="text-sm font-semibold text-wtva-muted hover:text-foreground"
              >
                See all
              </Link>
            </div>
            <Link
              href={`/venues/${promoted.id}`}
              className="block overflow-hidden rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 transition-colors hover:border-foreground/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-wtva-muted">
                Featured venue
              </p>
              <p className="mt-1 text-xl font-bold">{promoted.name}</p>
              <p className="mt-1 text-sm text-wtva-muted">
                {promoted.neighborhood ?? promoted.venue_type}
              </p>
            </Link>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Near you</h2>
          {filteredVenues.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVenues.map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-wtva-dark-300 py-16 text-center text-wtva-muted">
              No venues in this category yet.
            </p>
          )}
        </section>
      </div>

      <DiscoverBrowsePanel
        open={open}
        onClose={closeBrowse}
        neighborhoods={neighborhoods}
        initialSection={initialSection}
      />
    </>
  );
}

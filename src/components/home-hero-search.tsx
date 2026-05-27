"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { BrowseFiltersModal } from "@/components/browse-filters-modal";
import { eventTypeToSlug } from "@/lib/event-types";
import { activeFilterCount, type BrowseFilters } from "@/lib/filter-url";

type HomeHeroSearchProps = {
  neighborhoods: { name: string; slug: string }[];
  eventTypes: string[];
};

export function HomeHeroSearch({
  neighborhoods,
  eventTypes,
}: HomeHeroSearchProps) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>({});

  const modalFilters = useMemo(
    () => ({
      ...filters,
      q: query.trim() || undefined,
    }),
    [filters, query],
  );

  const filterCount = activeFilterCount(filters);

  return (
    <>
      <form action="/discover/search" method="get" className="mt-10 max-w-2xl">
        {filters.type && (
          <input type="hidden" name="type" value={eventTypeToSlug(filters.type)} />
        )}
        {filters.neighborhoods?.length ? (
          <input type="hidden" name="neighborhood" value={filters.neighborhoods.join(",")} />
        ) : null}
        {filters.featured && <input type="hidden" name="featured" value="1" />}
        {filters.days?.length ? (
          <input type="hidden" name="day" value={filters.days.join(",")} />
        ) : null}

        <div className="rounded-xl border border-wtva-dark-300/80 bg-black/40 p-2 shadow-lg backdrop-blur-md">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              name="q"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events, venues, or neighborhoods..."
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-wtva-subtle"
            />

            <div className="flex gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="relative inline-flex items-center justify-center gap-2 rounded-lg border border-wtva-dark-300/80 bg-black/20 px-4 py-3 text-sm font-semibold backdrop-blur-sm hover:border-foreground"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {filterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                    {filterCount}
                  </span>
                )}
              </button>

              <button
                type="submit"
                className="shrink-0 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </form>

      {filtersOpen && (
        <BrowseFiltersModal
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onApply={setFilters}
          basePath="/discover/search"
          filters={modalFilters}
          neighborhoods={neighborhoods}
          eventTypes={eventTypes}
          showDayOfWeek
        />
      )}
    </>
  );
}

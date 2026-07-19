"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { BrowseFiltersModal } from "@/components/browse-filters-modal";
import { eventTypeToSlug } from "@/lib/event-types";
import { activeFilterCount, buildBrowseUrl, type BrowseFilters } from "@/lib/filter-url";
import { buttonClass } from "@/lib/button";

type HomeHeroSearchProps = {
  neighborhoods: { name: string; slug: string }[];
  eventTypes: string[];
};

export function HomeHeroSearch({
  neighborhoods,
  eventTypes,
}: HomeHeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>({});

  function handleApply(next: BrowseFilters) {
    setFilters(next);
    router.push(
      buildBrowseUrl("/discover/search", {
        ...next,
        q: query.trim() || undefined,
      }),
    );
  }

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

        <div className="rounded-2xl border border-white/20 bg-white/95 p-2 shadow-card backdrop-blur-md">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wtva-subtle" />
              <input
                name="q"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events, DJs, venues, or experiences…"
                className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-wtva-subtle"
              />
            </div>

            <div className="flex gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={buttonClass("secondary", "lg", "relative px-4")}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {filterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {filterCount}
                  </span>
                )}
              </button>

              <button type="submit" className={buttonClass("primary", "lg", "shrink-0")}>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {filtersOpen && (
        <BrowseFiltersModal
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onApply={handleApply}
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

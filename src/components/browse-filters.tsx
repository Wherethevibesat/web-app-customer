"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { eventTypeToSlug } from "@/lib/event-types";
import { buildBrowseUrl, type BrowseFilters } from "@/lib/filter-url";
import { BrowseFiltersModal } from "@/components/browse-filters-modal";
import { cn } from "@/lib/utils";

type BrowseFiltersBarProps = {
  basePath: string;
  filters: BrowseFilters;
  neighborhoods: { name: string; slug: string }[];
  eventTypes?: string[];
  showFeatured?: boolean;
  showSearch?: boolean;
  showEventTypes?: boolean;
  showNeighborhoods?: boolean;
};

export function BrowseFiltersBar({
  basePath,
  filters,
  neighborhoods,
  eventTypes = [],
  showFeatured = false,
  showSearch = false,
  showEventTypes = true,
  showNeighborhoods = true,
}: BrowseFiltersBarProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const activeNeighborhoodName = useMemo(
    () =>
      neighborhoods.find((n) => n.slug === filters.neighborhood)?.name ??
      filters.neighborhood,
    [neighborhoods, filters.neighborhood],
  );

  const filterCount = [
    filters.type,
    filters.neighborhood,
    showFeatured && filters.featured ? "featured" : null,
  ].filter(Boolean).length;

  const showFilterButton = showEventTypes || (showNeighborhoods && neighborhoods.length > 0);

  return (
    <div className="space-y-3">
      {showSearch && (
        <form className="max-w-2xl" method="get">
          {filters.type && (
            <input type="hidden" name="type" value={eventTypeToSlug(filters.type)} />
          )}
          {filters.neighborhood && (
            <input type="hidden" name="neighborhood" value={filters.neighborhood} />
          )}
          {filters.featured && <input type="hidden" name="featured" value="1" />}
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search within results…"
              className="min-w-0 flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-2.5 text-sm outline-none focus:border-foreground"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
            >
              Search
            </button>
            {showFilterButton && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className={cn(
                  "relative shrink-0 inline-flex items-center gap-2 rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-2.5 text-sm font-semibold hover:border-foreground",
                  filterCount > 0 && "border-foreground/50",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {filterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                    {filterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </form>
      )}

      {filterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.featured && !filters.type && (
            <ActivePill
              label="Featured"
              clearHref={buildBrowseUrl(basePath, {
                ...filters,
                featured: undefined,
              })}
            />
          )}
          {filters.type && (
            <ActivePill
              label={filters.type}
              clearHref={buildBrowseUrl(basePath, {
                ...filters,
                type: undefined,
                featured: undefined,
              })}
            />
          )}
          {filters.neighborhood && (
            <ActivePill
              label={activeNeighborhoodName ?? filters.neighborhood}
              clearHref={buildBrowseUrl(basePath, {
                ...filters,
                neighborhood: undefined,
              })}
            />
          )}
          <Link
            href={buildBrowseUrl(basePath, { q: filters.q })}
            className="text-xs font-semibold text-wtva-muted hover:text-foreground"
          >
            Clear all
          </Link>
        </div>
      )}

      <BrowseFiltersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        basePath={basePath}
        filters={filters}
        neighborhoods={neighborhoods}
        eventTypes={eventTypes}
        showFeatured={showFeatured}
        showEventTypes={showEventTypes}
        showNeighborhoods={showNeighborhoods}
      />
    </div>
  );
}

function ActivePill({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <Link
      href={clearHref}
      className="inline-flex items-center gap-1 rounded-full border border-wtva-dark-300 bg-wtva-dark-300 px-3 py-1 text-xs font-semibold hover:border-foreground/40"
    >
      {label}
      <span className="text-wtva-muted" aria-hidden>
        ×
      </span>
    </Link>
  );
}

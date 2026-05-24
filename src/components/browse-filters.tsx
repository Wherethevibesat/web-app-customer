"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { eventTypeToSlug } from "@/lib/event-types";
import {
  activeFilterCount,
  buildBrowseUrl,
  toggleNeighborhoodSlug,
  type BrowseFilters,
} from "@/lib/filter-url";
import { formatEventDateLabel } from "@/lib/event-dates";
import { BrowseDatePicker } from "@/components/browse-date-picker";
import { BrowseFiltersModal } from "@/components/browse-filters-modal";
import { weekdayShortLabel } from "@/lib/weekdays";
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
  showDayOfWeek?: boolean;
  showDatePicker?: boolean;
  searchPath?: string;
  searchPlaceholder?: string;
  modalOpen?: boolean;
  onModalOpenChange?: (open: boolean) => void;
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
  showDayOfWeek = false,
  showDatePicker = false,
  searchPath,
  searchPlaceholder = "Search within results…",
  modalOpen: controlledModalOpen,
  onModalOpenChange,
}: BrowseFiltersBarProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const modalOpen = controlledModalOpen ?? internalModalOpen;
  const setModalOpen = onModalOpenChange ?? setInternalModalOpen;
  const formAction = searchPath ?? basePath;

  const neighborhoodNameBySlug = useMemo(
    () => new Map(neighborhoods.map((n) => [n.slug, n.name])),
    [neighborhoods],
  );

  const filterCount = activeFilterCount(filters);
  const hasActivePills =
    filterCount > 0 || Boolean(filters.date) || Boolean(filters.q);

  const showFilterButton =
    showEventTypes ||
    showDayOfWeek ||
    (showNeighborhoods && neighborhoods.length > 0);

  return (
    <div className="space-y-3">
      {showSearch && (
        <form className="max-w-2xl" method="get" action={formAction}>
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
          {filters.date ? <input type="hidden" name="date" value={filters.date} /> : null}
          <div className="flex flex-wrap gap-2">
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-2.5 text-sm outline-none focus:border-foreground"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
            >
              Search
            </button>
            {showDatePicker && <BrowseDatePicker basePath={basePath} filters={filters} />}
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

      {!showSearch && showDatePicker && (
        <div className="flex flex-wrap gap-2">
          <BrowseDatePicker basePath={basePath} filters={filters} />
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
              Filters
              {filterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                  {filterCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {hasActivePills && (
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
          {filters.days?.map((day) => (
            <ActivePill
              key={day}
              label={weekdayShortLabel(day)}
              clearHref={buildBrowseUrl(basePath, {
                ...filters,
                days: filters.days?.filter((value) => value !== day),
              })}
            />
          ))}
          {filters.date && (
            <ActivePill
              label={formatEventDateLabel(filters.date)}
              clearHref={buildBrowseUrl(basePath, {
                ...filters,
                date: undefined,
              })}
            />
          )}
          {filters.neighborhoods?.map((slug) => (
            <ActivePill
              key={slug}
              label={neighborhoodNameBySlug.get(slug) ?? slug}
              clearHref={buildBrowseUrl(basePath, {
                ...filters,
                neighborhoods: toggleNeighborhoodSlug(filters.neighborhoods, slug),
              })}
            />
          ))}
          <Link
            href={buildBrowseUrl(basePath, { q: filters.q, date: filters.date })}
            className="text-xs font-semibold text-wtva-muted hover:text-foreground"
          >
            Clear filters
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
        showDayOfWeek={showDayOfWeek}
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

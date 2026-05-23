import Link from "next/link";
import { eventTypeToSlug, mergeEventTypes } from "@/lib/event-types";
import { buildBrowseUrl, type BrowseFilters } from "@/lib/filter-url";

type BrowseFiltersProps = {
  basePath: string;
  filters: BrowseFilters;
  neighborhoods: { name: string; slug: string }[];
  eventTypes?: string[];
  showFeatured?: boolean;
  showSearch?: boolean;
  showEventTypes?: boolean;
  showNeighborhoods?: boolean;
};

function chipClass(active: boolean) {
  return `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-foreground text-background"
      : "border border-wtva-dark-300 hover:border-foreground"
  }`;
}

const chipRowClass =
  "mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function BrowseFiltersBar({
  basePath,
  filters,
  neighborhoods,
  eventTypes = [],
  showFeatured = false,
  showSearch = false,
  showEventTypes = true,
  showNeighborhoods = true,
}: BrowseFiltersProps) {
  const types = mergeEventTypes(eventTypes);
  const activeNeighborhood = filters.neighborhood;

  return (
    <div className="space-y-6">
      {showSearch && (
        <form className="max-w-2xl" method="get">
          {filters.type && (
            <input type="hidden" name="type" value={eventTypeToSlug(filters.type)} />
          )}
          {activeNeighborhood && (
            <input type="hidden" name="neighborhood" value={activeNeighborhood} />
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
          </div>
        </form>
      )}

      {showEventTypes && (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-wtva-muted">
          Event type
        </p>
        <div className={chipRowClass}>
          <Link
            href={buildBrowseUrl(basePath, {
              ...filters,
              type: undefined,
              featured: showFeatured ? filters.featured : undefined,
            })}
            className={chipClass(!filters.type && !filters.featured)}
          >
            All
          </Link>
          {showFeatured && (
            <Link
              href={buildBrowseUrl(basePath, {
                ...filters,
                featured: true,
                type: undefined,
              })}
              className={chipClass(Boolean(filters.featured && !filters.type))}
            >
              Featured
            </Link>
          )}
          {types.map((type) => (
            <Link
              key={type}
              href={buildBrowseUrl(basePath, {
                ...filters,
                type,
                featured: false,
              })}
              className={chipClass(filters.type === type)}
            >
              {type}
            </Link>
          ))}
        </div>
      </div>
      )}

      {showNeighborhoods && neighborhoods.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-wtva-muted">
            Neighborhood
          </p>
          <div className={chipRowClass}>
            <Link
              href={buildBrowseUrl(basePath, { ...filters, neighborhood: undefined })}
              className={chipClass(!activeNeighborhood)}
            >
              All areas
            </Link>
            {neighborhoods.map((n) => (
              <Link
                key={n.slug}
                href={buildBrowseUrl(basePath, {
                  ...filters,
                  neighborhood: n.slug,
                })}
                className={chipClass(activeNeighborhood === n.slug)}
              >
                {n.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

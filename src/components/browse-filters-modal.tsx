"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { mergeEventTypes } from "@/lib/event-types";
import { buildBrowseUrl, type BrowseFilters } from "@/lib/filter-url";
import { cn } from "@/lib/utils";

type BrowseFiltersModalProps = {
  open: boolean;
  onClose: () => void;
  basePath: string;
  filters: BrowseFilters;
  neighborhoods: { name: string; slug: string }[];
  eventTypes?: string[];
  showFeatured?: boolean;
  showEventTypes?: boolean;
  showNeighborhoods?: boolean;
};

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-white/20 bg-gradient-to-br from-white to-zinc-300 text-black"
          : "border-wtva-dark-300 bg-wtva-dark-300 text-foreground hover:border-foreground/40",
      )}
    >
      {label}
    </button>
  );
}

export function BrowseFiltersModal({
  open,
  onClose,
  basePath,
  filters,
  neighborhoods,
  eventTypes = [],
  showFeatured = false,
  showEventTypes = true,
  showNeighborhoods = true,
}: BrowseFiltersModalProps) {
  const router = useRouter();
  const types = mergeEventTypes(eventTypes);
  const eventsRef = useRef<HTMLDivElement>(null);
  const areasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function apply(next: BrowseFilters) {
    onClose();
    router.push(buildBrowseUrl(basePath, next));
  }

  const hasActive = Boolean(filters.type || filters.neighborhood || filters.featured);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex w-full flex-col bg-wtva-dark-400 md:max-w-lg md:rounded-2xl md:border md:border-wtva-dark-300",
          "max-h-[80vh] rounded-t-2xl border-t border-wtva-dark-300",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-wtva-dark-300 md:hidden" />
        <div className="flex items-center justify-between px-5 pb-2 pt-3 md:pt-4">
          <h2 className="text-lg font-extrabold">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-wtva-muted hover:bg-wtva-dark-300 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6 pt-2">
          {showEventTypes && (
            <div ref={eventsRef}>
              <h3 className="text-sm font-bold">Event type</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  active={!filters.type && !filters.featured}
                  onClick={() =>
                    apply({
                      ...filters,
                      type: undefined,
                      featured: undefined,
                    })
                  }
                />
                {showFeatured && (
                  <FilterChip
                    label="Featured"
                    active={Boolean(filters.featured && !filters.type)}
                    onClick={() =>
                      apply({
                        ...filters,
                        featured: true,
                        type: undefined,
                      })
                    }
                  />
                )}
                {types.map((type) => (
                  <FilterChip
                    key={type}
                    label={type}
                    active={filters.type === type}
                    onClick={() =>
                      apply({
                        ...filters,
                        type,
                        featured: false,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {showNeighborhoods && neighborhoods.length > 0 && (
            <div ref={areasRef} className={showEventTypes ? "mt-6" : undefined}>
              <h3 className="text-sm font-bold">Neighborhood</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <FilterChip
                  label="All areas"
                  active={!filters.neighborhood}
                  onClick={() =>
                    apply({
                      ...filters,
                      neighborhood: undefined,
                    })
                  }
                />
                {neighborhoods.map((n) => (
                  <FilterChip
                    key={n.slug}
                    label={n.name}
                    active={filters.neighborhood === n.slug}
                    onClick={() =>
                      apply({
                        ...filters,
                        neighborhood: n.slug,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {hasActive && (
          <div className="border-t border-wtva-dark-300 px-5 py-4">
            <button
              type="button"
              onClick={() =>
                apply({
                  q: filters.q,
                  type: undefined,
                  neighborhood: undefined,
                  featured: undefined,
                })
              }
              className="text-sm font-semibold text-wtva-muted hover:text-foreground"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

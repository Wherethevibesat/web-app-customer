"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { mergeEventTypes } from "@/lib/event-types";
import {
  buildBrowseUrl,
  toggleNeighborhoodSlug,
  type BrowseFilters,
} from "@/lib/filter-url";
import { toggleDayOfWeek, WEEKDAYS } from "@/lib/weekdays";
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
  showDayOfWeek?: boolean;
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

function draftHasSelection(draft: BrowseFilters): boolean {
  return Boolean(
    draft.type ||
      draft.featured ||
      draft.days?.length ||
      draft.neighborhoods?.length,
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
  showDayOfWeek = false,
}: BrowseFiltersModalProps) {
  const router = useRouter();
  const types = mergeEventTypes(eventTypes);
  const [draft, setDraft] = useState<BrowseFilters>(filters);

  useEffect(() => {
    if (!open) return;
    setDraft({
      type: filters.type,
      neighborhoods: filters.neighborhoods,
      featured: filters.featured,
      days: filters.days,
      date: filters.date,
      q: filters.q,
    });
  }, [open, filters]);

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

  function applyDraft() {
    onClose();
    router.push(buildBrowseUrl(basePath, draft));
  }

  function clearDraft() {
    setDraft({ q: filters.q, date: filters.date });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-2xl border-t border-wtva-dark-300 bg-wtva-dark-400">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-wtva-dark-300" />
        <div className="flex w-full items-center gap-2 px-5 pb-2 pt-3 md:px-8 md:pt-4">
          <h2 className="flex-1 text-lg font-extrabold">Filters</h2>
          {draftHasSelection(draft) && (
            <button
              type="button"
              onClick={clearDraft}
              className="text-sm font-semibold text-wtva-muted hover:text-foreground"
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-wtva-muted hover:bg-wtva-dark-300 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="w-full overflow-y-auto px-5 pb-4 pt-2 md:px-8">
          {showEventTypes && (
            <div>
              <h3 className="text-sm font-bold">Event type</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  active={!draft.type && !draft.featured}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      type: undefined,
                      featured: undefined,
                    }))
                  }
                />
                {showFeatured && (
                  <FilterChip
                    label="Featured"
                    active={Boolean(draft.featured && !draft.type)}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        featured: true,
                        type: undefined,
                      }))
                    }
                  />
                )}
                {types.map((type) => (
                  <FilterChip
                    key={type}
                    label={type}
                    active={draft.type === type}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        type,
                        featured: false,
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {showDayOfWeek && (
            <div className={showEventTypes ? "mt-6" : undefined}>
              <h3 className="text-sm font-bold">Day of week</h3>
              <p className="mt-1 text-xs text-wtva-muted">Select one or more days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <FilterChip
                  label="Any day"
                  active={!draft.days?.length}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      days: undefined,
                    }))
                  }
                />
                {WEEKDAYS.map((day) => (
                  <FilterChip
                    key={day.id}
                    label={day.shortLabel}
                    active={draft.days?.includes(day.id) ?? false}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        days: toggleDayOfWeek(prev.days, day.id),
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {showNeighborhoods && neighborhoods.length > 0 && (
            <div className={showEventTypes || showDayOfWeek ? "mt-6" : undefined}>
              <h3 className="text-sm font-bold">Neighborhood</h3>
              <p className="mt-1 text-xs text-wtva-muted">Select one or more areas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <FilterChip
                  label="All areas"
                  active={!draft.neighborhoods?.length}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      neighborhoods: undefined,
                    }))
                  }
                />
                {neighborhoods.map((n) => (
                  <FilterChip
                    key={n.slug}
                    label={n.name}
                    active={draft.neighborhoods?.includes(n.slug) ?? false}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        neighborhoods: toggleNeighborhoodSlug(prev.neighborhoods, n.slug),
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-wtva-dark-300 px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={applyDraft}
            className="w-full rounded-xl bg-foreground py-3.5 text-sm font-bold text-background hover:opacity-90"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}

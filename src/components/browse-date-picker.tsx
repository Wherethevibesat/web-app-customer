"use client";

import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { toLocalIsoDate, type EventDateIso } from "@/lib/event-dates";
import { buildBrowseUrl, type BrowseFilters } from "@/lib/filter-url";
import { cn } from "@/lib/utils";

type BrowseDatePickerProps = {
  basePath: string;
  filters: BrowseFilters;
};

export function BrowseDatePicker({ basePath, filters }: BrowseDatePickerProps) {
  const router = useRouter();
  const minDate = toLocalIsoDate(new Date());

  return (
    <label
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-lg border border-wtva-dark-300 bg-wtva-card",
        filters.date && "border-foreground/50",
      )}
    >
      <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-wtva-muted" />
      <input
        type="date"
        min={minDate}
        value={filters.date ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          const date: EventDateIso | undefined = raw
            ? (raw as EventDateIso)
            : undefined;
          router.push(buildBrowseUrl(basePath, { ...filters, date }));
        }}
        aria-label="Filter by date"
        className="min-w-[9.5rem] cursor-pointer appearance-none rounded-lg bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none [color-scheme:dark]"
      />
    </label>
  );
}

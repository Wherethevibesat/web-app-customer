"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

type DiscoverSearchBarProps = {
  onFilterOpen: () => void;
};

export function DiscoverSearchBar({ onFilterOpen }: DiscoverSearchBarProps) {
  return (
    <div className="flex h-12 items-center gap-3 rounded-xl border border-wtva-dark-300/90 bg-wtva-dark-400 px-4 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.03)]">
      <Link
        href="/discover/search"
        className="flex min-w-0 flex-1 items-center gap-3 text-sm font-medium text-wtva-muted"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Search venues, events, people…</span>
      </Link>
      <button
        type="button"
        onClick={onFilterOpen}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-wtva-dark-300/80 bg-wtva-dark-300 text-wtva-muted hover:text-foreground"
        aria-label="Browse filters"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}

"use client";

import { VENUE_CATEGORIES } from "@/lib/discover-categories";
import { cn } from "@/lib/utils";

type VenueCategoryChipsProps = {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onLocationSelect: () => void;
};

export function VenueCategoryChips({
  selectedIndex,
  onSelect,
  onLocationSelect,
}: VenueCategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {VENUE_CATEGORIES.map((label, index) => {
        const selected = index === selectedIndex;
        const isLocation = label === "Location";

        return (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (isLocation) {
                onLocationSelect();
                return;
              }
              onSelect(index);
            }}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold tracking-tight transition-all",
              selected && !isLocation
                ? "border-white/20 bg-gradient-to-br from-white to-zinc-300 text-black shadow-[0_4px_14px_rgba(255,255,255,0.15)]"
                : "border-wtva-dark-300/85 bg-wtva-dark-400 text-wtva-muted hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

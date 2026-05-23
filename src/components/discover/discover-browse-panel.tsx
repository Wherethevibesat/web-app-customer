"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { EVENT_TYPES, eventTypeToSlug } from "@/lib/event-types";
import type { DiscoverBrowseSection } from "@/lib/types/discover";
import { cn } from "@/lib/utils";

export type NeighborhoodOption = {
  name: string;
  slug: string;
};

type DiscoverBrowsePanelProps = {
  open: boolean;
  onClose: () => void;
  neighborhoods: NeighborhoodOption[];
  initialSection?: DiscoverBrowseSection;
};

function BrowseChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-wtva-dark-300 bg-wtva-dark-300 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-foreground/40"
    >
      {label}
    </button>
  );
}

function BrowseContent({
  neighborhoods,
  initialSection,
  onNavigate,
}: {
  neighborhoods: NeighborhoodOption[];
  initialSection?: DiscoverBrowseSection;
  onNavigate: (href: string) => void;
}) {
  const eventsRef = useRef<HTMLDivElement>(null);
  const areasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialSection) return;
    const target = initialSection === "areas" ? areasRef.current : eventsRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialSection]);

  return (
    <div className="space-y-6">
      <div ref={eventsRef}>
        <h3 className="text-sm font-bold">Event type</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <BrowseChip
            label="All events"
            onClick={() => onNavigate("/discover/events")}
          />
          {EVENT_TYPES.map((type) => (
            <BrowseChip
              key={type}
              label={type}
              onClick={() =>
                onNavigate(`/discover/events?type=${eventTypeToSlug(type)}`)
              }
            />
          ))}
        </div>
      </div>

      <div ref={areasRef}>
        <h3 className="text-sm font-bold">Neighborhood</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {neighborhoods.length === 0 ? (
            <p className="text-sm text-wtva-muted">No neighborhoods loaded yet.</p>
          ) : (
            neighborhoods.map((n) => (
              <BrowseChip
                key={n.slug}
                label={n.name}
                onClick={() => onNavigate(`/discover/neighborhoods/${n.slug}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function DiscoverBrowsePanel({
  open,
  onClose,
  neighborhoods,
  initialSection,
}: DiscoverBrowsePanelProps) {
  const router = useRouter();

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

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close browse"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex w-full flex-col bg-wtva-dark-400 md:max-w-md md:rounded-2xl md:border md:border-wtva-dark-300",
          "max-h-[72vh] rounded-t-2xl border-t border-wtva-dark-300 md:max-h-[80vh]",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-wtva-dark-300 md:hidden" />
        <div className="flex items-center justify-between px-5 pb-2 pt-3 md:pt-4">
          <h2 className="text-lg font-extrabold">Browse</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-wtva-muted hover:bg-wtva-dark-300 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-8 pt-2">
          <BrowseContent
            neighborhoods={neighborhoods}
            initialSection={initialSection}
            onNavigate={navigate}
          />
        </div>
      </div>
    </div>
  );
}

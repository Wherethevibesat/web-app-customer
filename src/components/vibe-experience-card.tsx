"use client";

import Image from "next/image";
import { Info } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { slotTypeLabel } from "@/lib/data/night-packages-shared";
import { slotMoodEmoji, vibeCopy } from "@/lib/vibe-copy";
import { VenueNameButton } from "@/components/venue-name-button";

export type VibeExperienceCardData = {
  id: string;
  title?: string;
  slot_type: string;
  price_cents?: number;
  arrival_window?: string | null;
  scheduled_label?: string | null;
  image_url?: string | null;
  why_picked?: string | null;
  venue?: { id: string; name: string } | null;
};

export function VibeExperienceCard({
  stop,
  index,
  total,
  showPrice = true,
  tipOpen = false,
  onToggleTip,
  onChange,
  actionLabel,
}: {
  stop: VibeExperienceCardData;
  index?: number;
  total?: number;
  showPrice?: boolean;
  tipOpen?: boolean;
  onToggleTip?: () => void;
  onChange?: () => void;
  actionLabel?: string;
}) {
  const time =
    stop.scheduled_label?.trim() ||
    stop.arrival_window?.split(/[–—-]/)[0]?.trim() ||
    "";
  const tip = stop.why_picked?.trim();
  const venueName = stop.venue?.name ?? stop.title ?? "Place";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-card shadow-card">
      <div className="relative aspect-[16/10] bg-wtva-dark-200">
        {stop.image_url ? (
          <Image
            src={stop.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-accent-gradient opacity-90">
            <span className="text-4xl" aria-hidden>
              {slotMoodEmoji(stop.slot_type)}
            </span>
          </div>
        )}
        {index != null && total != null && total > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {index + 1}/{total}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-1.5">
          <p className="min-w-0 flex-1 font-bold leading-tight">
            {slotTypeLabel(stop.slot_type)}
          </p>
          {tip && onToggleTip ? (
            <button
              type="button"
              className="rounded-full p-0.5 text-wtva-muted hover:text-accent"
              aria-label="Venue highlight"
              onClick={onToggleTip}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-wtva-muted">
          <VenueNameButton
            venueId={stop.venue?.id}
            name={venueName}
            className="inline text-sm"
          />
        </p>
        {time ? (
          <p className="mt-0.5 text-xs font-semibold text-wtva-muted">{time}</p>
        ) : null}
        {tipOpen && tip ? (
          <p className="mt-2 text-xs leading-relaxed text-wtva-muted">
            <span className="font-semibold text-foreground">From the venue — </span>
            {tip}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {showPrice && stop.price_cents != null ? (
            <p className="text-sm font-bold tabular-nums">
              {formatPrice(stop.price_cents / 100)}
              <span className="font-normal text-wtva-muted"> / person</span>
            </p>
          ) : (
            <span />
          )}
          {onChange ? (
            <button
              type="button"
              className="shrink-0 text-sm font-semibold text-accent hover:opacity-80"
              onClick={onChange}
            >
              {actionLabel ?? `${vibeCopy.changeStop} ›`}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function VibeExperienceCardGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {children}
    </ul>
  );
}

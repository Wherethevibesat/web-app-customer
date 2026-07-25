"use client";

import { slotTypeLabel } from "@/lib/data/night-packages-shared";
import { slotMoodEmoji } from "@/lib/vibe-copy";
import { VenueNameButton } from "@/components/venue-name-button";

type Stop = {
  id: string;
  scheduled_label: string | null;
  stop_offer: {
    title: string;
    slot_type: string;
    arrival_window: string | null;
    venue: { id: string; name: string } | null;
  };
};

/** Same card list layout as Build — compact rows in one bordered card. */
export function VibePreviewStops({ stops }: { stops: Stop[] }) {
  return (
    <ul className="divide-y divide-wtva-dark-300 overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-card">
      {stops.map((stop, index) => {
        const offer = stop.stop_offer;
        const time =
          stop.scheduled_label?.trim() ||
          offer.arrival_window?.split(/[–—-]/)[0]?.trim() ||
          "";
        return (
          <li key={stop.id}>
            <div className="flex min-h-[80px] items-center gap-3 px-4 py-3">
              <span className="text-2xl leading-none" aria-hidden>
                {slotMoodEmoji(offer.slot_type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">
                  {slotTypeLabel(offer.slot_type)}
                </p>
                <p className="truncate text-sm text-wtva-muted">
                  <VenueNameButton
                    venueId={offer.venue?.id}
                    name={offer.venue?.name ?? offer.title}
                    className="inline text-sm"
                  />
                  {time ? ` · ${time}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-wtva-muted">
                {index + 1}/{stops.length}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

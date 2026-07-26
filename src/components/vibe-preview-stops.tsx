"use client";

import {
  VibeExperienceCard,
  VibeExperienceCardGrid,
} from "@/components/vibe-experience-card";

type Stop = {
  id: string;
  scheduled_label: string | null;
  stop_offer: {
    title: string;
    slot_type: string;
    price_cents?: number;
    arrival_window: string | null;
    image_url?: string | null;
    why_picked?: string | null;
    venue: { id: string; name: string } | null;
  };
};

/** Experience cards — same grid as Build. */
export function VibePreviewStops({ stops }: { stops: Stop[] }) {
  return (
    <VibeExperienceCardGrid>
      {stops.map((stop, index) => {
        const offer = stop.stop_offer;
        return (
          <li key={stop.id}>
            <VibeExperienceCard
              stop={{
                id: stop.id,
                title: offer.title,
                slot_type: offer.slot_type,
                price_cents: offer.price_cents,
                arrival_window: offer.arrival_window,
                scheduled_label: stop.scheduled_label,
                image_url: offer.image_url,
                why_picked: offer.why_picked,
                venue: offer.venue,
              }}
              index={index}
              total={stops.length}
              showPrice={offer.price_cents != null}
            />
          </li>
        );
      })}
    </VibeExperienceCardGrid>
  );
}

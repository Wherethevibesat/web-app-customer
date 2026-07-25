"use client";

import { useState } from "react";
import { VenuePreviewModal } from "@/components/venue-preview-modal";

/** Clickable venue name → preview modal (stays in booking flow). */
export function VenueNameButton({
  venueId,
  name,
  className = "",
}: {
  venueId: string | null | undefined;
  name: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!venueId) {
    return <span className={className}>{name}</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-left font-medium text-accent underline-offset-2 hover:underline ${className}`}
      >
        {name}
      </button>
      <VenuePreviewModal
        venueId={venueId}
        venueName={name}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

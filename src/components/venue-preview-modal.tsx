"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MapPin, Phone, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EVENT_PLACEHOLDER } from "@/lib/placeholder";

type VenuePreview = {
  id: string;
  name: string;
  venue_type: string | null;
  address: string | null;
  neighborhood: string | null;
  image_url: string | null;
  description: string | null;
  phone: string | null;
  hours_label: string | null;
  is_open: boolean | null;
};

type Props = {
  venueId: string;
  venueName: string;
  open: boolean;
  onClose: () => void;
};

/** In-flow venue peek — stays in booking; no full-page navigation. */
export function VenuePreviewModal({ venueId, venueName, open, onClose }: Props) {
  const [venue, setVenue] = useState<VenuePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open || !venueId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setVenue(null);
    (async () => {
      try {
        const supabase = createClient();
        const { data, error: qErr } = await supabase
          .from("venues")
          .select(
            "id, name, venue_type, address, neighborhood, image_url, description, phone, hours_label, is_open",
          )
          .eq("id", venueId)
          .eq("published", true)
          .maybeSingle();
        if (cancelled) return;
        if (qErr) {
          setError("Couldn’t load venue");
          setLoading(false);
          return;
        }
        setVenue((data as VenuePreview | null) ?? null);
        if (!data) setError("Venue unavailable");
      } catch {
        if (!cancelled) setError("Couldn’t load venue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, venueId]);

  if (!open) return null;

  const name = venue?.name ?? venueName;
  const directionsUrl = venue?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`
    : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-preview-title"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-t-3xl border border-wtva-dark-300 bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-wtva-dark-300 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Venue
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-wtva-muted hover:bg-wtva-dark-400 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          {loading && (
            <p className="py-8 text-center text-sm text-wtva-muted">Loading…</p>
          )}
          {error && !loading && (
            <p className="py-8 text-center text-sm text-wtva-muted">{error}</p>
          )}
          {!loading && !error && (
            <>
              <div className="relative h-36 overflow-hidden rounded-2xl bg-wtva-dark-400">
                <Image
                  src={venue?.image_url || EVENT_PLACEHOLDER}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <h2
                id="venue-preview-title"
                className="mt-4 text-xl font-bold tracking-tight"
              >
                {name}
              </h2>
              <p className="mt-1 text-sm text-wtva-muted">
                {[venue?.venue_type, venue?.neighborhood].filter(Boolean).join(" · ") ||
                  "Houston"}
                {venue?.is_open === true
                  ? " · Open now"
                  : venue?.is_open === false
                    ? " · Closed"
                    : ""}
              </p>
              {venue?.description && (
                <p className="mt-3 text-sm leading-relaxed text-wtva-muted line-clamp-4">
                  {venue.description}
                </p>
              )}
              <ul className="mt-4 space-y-2 text-sm">
                {venue?.hours_label && (
                  <li className="text-wtva-muted">Hours: {venue.hours_label}</li>
                )}
                {venue?.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-wtva-muted" />
                    <a
                      href={`tel:${venue.phone.replace(/\s/g, "")}`}
                      className="font-medium hover:underline"
                    >
                      {venue.phone}
                    </a>
                  </li>
                )}
                {venue?.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wtva-muted" />
                    <span>{venue.address}</span>
                  </li>
                )}
              </ul>
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-accent hover:opacity-80"
                >
                  Get directions
                </a>
              )}
            </>
          )}
        </div>

        <div className="border-t border-wtva-dark-300 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-accent-gradient py-3 text-sm font-bold text-white shadow-accent"
          >
            Back to booking
          </button>
        </div>
      </div>
    </div>
  );
}

import { BadgeCheck, MapPin, Phone, Star, Users } from "lucide-react";
import type { Venue } from "@/lib/data/venues";

export function VenueQuickInfo({ venue }: { venue: Venue }) {
  const directionsUrl =
    venue.latitude != null && venue.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
      : venue.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`
        : null;

  const hasBadges =
    venue.verified ||
    venue.is_open != null ||
    venue.rating != null ||
    (venue.check_in_count ?? 0) > 0 ||
    venue.featured;
  const hasContact = venue.phone || venue.address || directionsUrl;

  if (!hasBadges && !hasContact) return null;

  return (
    <div className="mt-6">
      {hasBadges && (
        <div className="flex flex-wrap gap-2">
          {venue.verified && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              Verified venue
            </span>
          )}
          {venue.is_open === true && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Open now
            </span>
          )}
          {venue.is_open === false && (
            <span className="rounded-full border border-wtva-dark-300 px-3 py-1 text-xs font-medium text-wtva-muted">
              Closed
            </span>
          )}
          {venue.featured && (
            <span className="rounded-full bg-accent-gradient px-3 py-1 text-xs font-semibold text-white shadow-accent">
              Featured
            </span>
          )}
          {venue.rating != null && venue.rating > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-wtva-dark-300 px-3 py-1 text-xs font-medium">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {venue.rating.toFixed(1)}
            </span>
          )}
          {(venue.check_in_count ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-wtva-dark-300 px-3 py-1 text-xs font-medium text-wtva-muted">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {venue.check_in_count} check-in{venue.check_in_count === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}

      {hasContact && (
        <ul className={`space-y-2 text-sm ${hasBadges ? "mt-4" : ""}`}>
          {venue.phone && (
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-wtva-muted" aria-hidden />
              <a href={`tel:${venue.phone.replace(/\s/g, "")}`} className="hover:underline">
                {venue.phone}
              </a>
            </li>
          )}
          {venue.address && (
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wtva-muted" aria-hidden />
              <span>{venue.address}</span>
            </li>
          )}
          {directionsUrl && (
            <li>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium hover:underline"
              >
                Get directions
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

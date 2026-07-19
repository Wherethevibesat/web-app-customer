import Link from "next/link";
import Image from "next/image";
import type { Venue } from "@/lib/data/venues";

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Link
      href={`/venues/${venue.id}`}
      className="block overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] bg-wtva-dark-400">
        {venue.image_url ? (
          <Image src={venue.image_url} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-wtva-subtle text-sm">
            No image
          </div>
        )}
        {venue.featured && (
          <span className="absolute left-2 top-2 rounded-full bg-accent-gradient px-2.5 py-0.5 text-xs font-semibold text-white shadow-accent">
            Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{venue.name}</h3>
          {venue.rating != null && (
            <span className="shrink-0 text-sm font-semibold text-amber-500">★ {venue.rating}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-wtva-muted">
          {venue.venue_type}
          {venue.neighborhood ? ` · ${venue.neighborhood}` : ""}
        </p>
      </div>
    </Link>
  );
}

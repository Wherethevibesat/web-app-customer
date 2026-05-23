import Link from "next/link";
import Image from "next/image";
import type { Venue } from "@/lib/data/venues";

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Link
      href={`/venues/${venue.id}`}
      className="block overflow-hidden rounded-xl border border-wtva-dark-300 bg-wtva-card transition-colors hover:border-wtva-muted"
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
          <span className="absolute left-2 top-2 rounded bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
            Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{venue.name}</h3>
        <p className="mt-1 text-sm text-wtva-muted">
          {venue.venue_type}
          {venue.neighborhood ? ` · ${venue.neighborhood}` : ""}
        </p>
        {venue.rating != null && (
          <p className="mt-1 text-sm">★ {venue.rating}</p>
        )}
      </div>
    </Link>
  );
}

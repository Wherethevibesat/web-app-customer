"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { Venue } from "@/lib/data/venues";

const VenueMapInner = dynamic(
  () => import("@/components/venue-map-inner").then((m) => m.VenueMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[21/9] min-h-[360px] items-center justify-center rounded-xl bg-wtva-dark-400">
        <p className="text-sm text-wtva-muted">Loading map…</p>
      </div>
    ),
  },
);

const VenueMapLibreInner = dynamic(
  () => import("@/components/venue-map-libre-inner").then((m) => m.VenueMapLibreInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[21/9] min-h-[360px] items-center justify-center rounded-xl bg-wtva-dark-400">
        <p className="text-sm text-wtva-muted">Loading map…</p>
      </div>
    ),
  },
);

type Props = {
  venues: Venue[];
};

export function VenueMap({ venues }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const withCoords = venues.filter(
    (v) => v.latitude != null && v.longitude != null,
  );

  if (withCoords.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-wtva-dark-300 bg-wtva-dark-400 p-8 text-center text-sm text-wtva-muted">
        No venues with map coordinates yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-wtva-dark-300">
      {token ? (
        <VenueMapInner venues={withCoords} token={token} />
      ) : (
        <VenueMapLibreInner venues={withCoords} />
      )}
      <p className="border-t border-wtva-dark-300 bg-wtva-card px-4 py-2 text-xs text-wtva-muted">
        {withCoords.length} venue{withCoords.length === 1 ? "" : "s"} on map ·{" "}
        <Link href="/venues" className="underline hover:text-foreground">
          View all venues
        </Link>
        {!token && (
          <>
            {" "}
            · Set <code className="text-foreground">NEXT_PUBLIC_MAPBOX_TOKEN</code> for Mapbox
            styling
          </>
        )}
      </p>
    </div>
  );
}

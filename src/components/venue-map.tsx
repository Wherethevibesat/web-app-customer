"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin } from "lucide-react";
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

type Props = {
  venues: Venue[];
};

export function VenueMap({ venues }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const withCoords = venues.filter(
    (v) => v.latitude != null && v.longitude != null,
  );

  if (!token) {
    return (
      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6">
        <div className="flex aspect-[21/9] min-h-[280px] items-center justify-center rounded-xl border border-dashed border-wtva-dark-300 bg-wtva-dark-400">
          <div className="max-w-md px-6 text-center">
            <MapPin className="mx-auto h-10 w-10 text-wtva-subtle" />
            <p className="mt-4 font-medium">Mapbox token not configured</p>
            <p className="mt-2 text-sm text-wtva-muted">
              Add <code className="text-foreground">NEXT_PUBLIC_MAPBOX_TOKEN</code> to{" "}
              <code className="text-foreground">.env.local</code> to enable the interactive map.
            </p>
          </div>
        </div>
        {withCoords.length > 0 && (
          <p className="mt-4 text-sm text-wtva-muted">
            {withCoords.length} venues have coordinates — browse the list below or open in Google Maps.
          </p>
        )}
      </div>
    );
  }

  if (withCoords.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-wtva-dark-300 bg-wtva-dark-400 p-8 text-center text-sm text-wtva-muted">
        No venues with map coordinates yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-wtva-dark-300">
      <VenueMapInner venues={withCoords} token={token} />
      <p className="border-t border-wtva-dark-300 bg-wtva-card px-4 py-2 text-xs text-wtva-muted">
        {withCoords.length} venue{withCoords.length === 1 ? "" : "s"} on map ·{" "}
        <Link href="/venues" className="underline hover:text-foreground">
          View all venues
        </Link>
      </p>
    </div>
  );
}

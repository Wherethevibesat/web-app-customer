"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Venue } from "@/lib/data/venues";

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type Props = {
  venues: Venue[];
};

export function VenueMapLibreInner({ venues }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = venues.find((v) => v.id === activeId);

  const { center, zoom } = useMemo(() => {
    const lats = venues.map((v) => v.latitude!);
    const lngs = venues.map((v) => v.longitude!);
    const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    const spread =
      Math.max(
        ...lats.map((la, i) => Math.abs(la - lat) + Math.abs(lngs[i]! - lng)),
      ) || 0.05;
    const z = spread < 0.02 ? 14 : spread < 0.08 ? 12 : 10;
    return { center: { lat, lng }, zoom: z };
  }, [venues]);

  return (
    <div className="relative h-[min(70vh,520px)] w-full min-h-[360px]">
      <Map
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom,
        }}
        mapStyle={DARK_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        {venues.map((v) => (
          <Marker
            key={v.id}
            longitude={v.longitude!}
            latitude={v.latitude!}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setActiveId(v.id);
            }}
          >
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-2 ring-background/50"
              aria-label={v.name}
            >
              <span className="text-xs font-bold">●</span>
            </button>
          </Marker>
        ))}
        {active && (
          <Popup
            longitude={active.longitude!}
            latitude={active.latitude!}
            anchor="top"
            onClose={() => setActiveId(null)}
            closeButton
            className="[&_.maplibregl-popup-content]:!bg-wtva-card [&_.maplibregl-popup-content]:!text-foreground [&_.maplibregl-popup-content]:!rounded-lg [&_.maplibregl-popup-content]:!border [&_.maplibregl-popup-content]:!border-wtva-dark-300"
          >
            <p className="font-semibold text-sm">{active.name}</p>
            {active.neighborhood && (
              <p className="text-xs text-wtva-muted mt-0.5">{active.neighborhood}</p>
            )}
            <Link
              href={`/venues/${active.id}`}
              className="mt-2 inline-block text-xs font-semibold underline"
            >
              View venue
            </Link>
          </Popup>
        )}
      </Map>
    </div>
  );
}

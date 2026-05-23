import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { VenueCard } from "@/components/venue-card";
import { VenueMap } from "@/components/venue-map";
import { listVenues } from "@/lib/data/venues";
import { listNeighborhoodGroups } from "@/lib/data/neighborhoods";

export default async function MapPage() {
  const [venues, neighborhoods] = await Promise.all([
    listVenues().catch(() => []),
    listNeighborhoodGroups().catch(() => []),
  ]);

  return (
    <PageShell
      title="Map & neighborhoods"
      subtitle="Explore venues on the map or by neighborhood"
      width="wide"
    >
      <VenueMap venues={venues} />

      <section className="mt-12">
        <h2 className="text-xl font-bold">By neighborhood</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {neighborhoods.map((n) => (
            <Link
              key={n.slug}
              href={`/neighborhoods/${n.slug}`}
              className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground transition-colors"
            >
              <h3 className="font-semibold">{n.name}</h3>
              <p className="mt-1 text-sm text-wtva-muted">
                {n.venues.length} venue{n.venues.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">All venues</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {venues.map((v) => (
            <div key={v.id} className="relative">
              <VenueCard venue={v} />
              {v.latitude != null && v.longitude != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white backdrop-blur hover:bg-black"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

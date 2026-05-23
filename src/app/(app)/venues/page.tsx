import Link from "next/link";
import { VenueCard } from "@/components/venue-card";
import { listVenues } from "@/lib/data/venues";

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const venues = await listVenues(q).catch(() => []);
  const featured = venues.filter((v) => v.featured);
  const rest = venues.filter((v) => !v.featured);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Venues</h1>
      <p className="mt-2 max-w-2xl text-wtva-muted">
        Clubs, lounges, and nightlife spots. Check in when you visit to earn ranking points.
      </p>

      <form className="mt-8 max-w-md" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or neighborhood…"
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm outline-none focus:border-foreground"
        />
      </form>

      {featured.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-wtva-muted">
            Featured
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        {featured.length > 0 && (
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-wtva-muted">
            All venues
          </h2>
        )}
        {rest.length > 0 || featured.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(featured.length ? rest : venues).map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-wtva-dark-300 py-20 text-center text-wtva-muted">
            No venues found. Try a different search.
          </p>
        )}
      </section>
    </div>
  );
}

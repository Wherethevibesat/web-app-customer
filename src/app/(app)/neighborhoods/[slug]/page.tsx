import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { VenueCard } from "@/components/venue-card";
import { listPublishedEvents } from "@/lib/data/events";
import { getNeighborhoodBySlug } from "@/lib/data/neighborhoods";

export default async function NeighborhoodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await getNeighborhoodBySlug(slug);
  if (!group) notFound();

  const events = await listPublishedEvents({
    neighborhood: group.name,
    limit: 12,
  }).catch(() => []);

  return (
    <PageShell
      title={group.name}
      subtitle={`${group.venues.length} venues in this area`}
      backHref="/map"
      backLabel="Map & areas"
      width="wide"
    >
      {events.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold">Upcoming events</h2>
          <ul className="mt-4 space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/events/${e.id}`}
                  className="block rounded-lg border border-wtva-dark-300 px-4 py-3 hover:border-foreground"
                >
                  <span className="font-medium">{e.title}</span>
                  <span className="ml-2 text-sm text-wtva-muted">
                    {new Date(e.starts_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {group.venues.map((v) => (
          <VenueCard key={v.id} venue={v} />
        ))}
      </div>
    </PageShell>
  );
}

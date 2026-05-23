import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { listPublishedEvents, getEventTypes } from "@/lib/data/events";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; featured?: string }>;
}) {
  const { type, featured } = await searchParams;
  const [events, types] = await Promise.all([
    listPublishedEvents({
      eventType: type,
      featuredOnly: featured === "1",
      upcomingOnly: true,
      limit: 60,
    }).catch(() => []),
    getEventTypes().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Events</h1>
      <p className="mt-2 max-w-2xl text-wtva-muted">
        Parties, concerts, and nightlife happening soon. Filter by type or browse all.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/events"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !type && featured !== "1"
              ? "bg-foreground text-background"
              : "border border-wtva-dark-300 hover:border-foreground"
          }`}
        >
          All upcoming
        </Link>
        <Link
          href="/events?featured=1"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            featured === "1"
              ? "bg-foreground text-background"
              : "border border-wtva-dark-300 hover:border-foreground"
          }`}
        >
          Featured
        </Link>
        {types.map((t) => (
          <Link
            key={t}
            href={`/events?type=${encodeURIComponent(t)}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              type === t
                ? "bg-foreground text-background"
                : "border border-wtva-dark-300 hover:border-foreground"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {events.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-xl border border-dashed border-wtva-dark-300 py-20 text-center text-wtva-muted">
          No events match this filter.{" "}
          <Link href="/events" className="underline">
            View all events
          </Link>
        </p>
      )}
    </div>
  );
}

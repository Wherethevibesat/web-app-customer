import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { VenueDetailsExtra } from "@/components/venue-details-extra";
import { MessageVenueButton } from "@/components/message-venue-button";
import { EventCard } from "@/components/event-card";
import { getVenue } from "@/lib/data/venues";
import { listEventsByVenue } from "@/lib/data/events";
import { createClient } from "@/lib/supabase/server";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [venue, venueEvents] = await Promise.all([
    getVenue(id),
    listEventsByVenue(id),
  ]);
  if (!venue) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let favorited = false;
  if (user) {
    const { data } = await supabase
      .from("user_favorites")
      .select("venue_id")
      .eq("user_id", user.id)
      .eq("venue_id", id)
      .maybeSingle();
    favorited = !!data;
  }

  return (
    <article>
      <div className="relative aspect-[21/9] max-h-[400px] w-full bg-wtva-dark-400">
        {venue.image_url ? (
          <Image src={venue.image_url} alt="" fill className="object-cover" unoptimized priority />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-wtva-muted">{venue.venue_type}</p>
            <h1 className="mt-1 text-3xl font-bold md:text-4xl">{venue.name}</h1>
            {venue.neighborhood && (
              <p className="mt-2 text-wtva-muted">{venue.neighborhood}</p>
            )}
          </div>
          {user && <FavoriteButton venueId={id} initialFavorited={favorited} />}
        </div>

        {venue.description && (
          <p className="mt-6 text-wtva-muted leading-relaxed">{venue.description}</p>
        )}
        {venue.address && <p className="mt-2">{venue.address}</p>}

        <VenueDetailsExtra venue={venue} />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={user ? `/check-in?venue=${id}` : `/auth/login?next=/venues/${id}`}
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            Check in (+25 pts)
          </Link>
          <MessageVenueButton venueId={id} venueName={venue.name} signedIn={!!user} />
        </div>

        {venueEvents.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold">Upcoming events here</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {venueEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { VenueDetailsExtra } from "@/components/venue-details-extra";
import { MessageVenueButton } from "@/components/message-venue-button";
import { BrowseEventCard } from "@/components/browse-event-card";
import { VenueCard } from "@/components/venue-card";
import { DriverCompanyCard } from "@/components/driver-company-card";
import { VenueQuickInfo } from "@/components/venue-quick-info";
import { VenuePromoterCard } from "@/components/venue-promoter-card";
import { VenueShareButton } from "@/components/venue-share-button";
import { VenueTablesSection } from "@/components/venue-tables-section";
import { VenueVipPackagesSection } from "@/components/venue-vip-packages-section";
import { getVenue, listRelatedVenues } from "@/lib/data/venues";
import { browseItemKey, listBrowseFeed } from "@/lib/browse-events";
import {
  listPastEventsByVenue,
  listVenueVipPackages,
} from "@/lib/data/events";
import { listOffersForVenue, listPromotersForVenue } from "@/lib/data/promoters";
import { listPublishedDrivers } from "@/lib/data/drivers";
import { formatEventDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const venue = await getVenue(id);
  if (!venue) return { title: "Venue not found" };

  const description =
    venue.description?.slice(0, 160) ??
    `${venue.venue_type} in ${venue.neighborhood ?? "Houston"}. Events, VIP, and check-ins on WTVA.`;

  return {
    title: venue.name,
    description,
    openGraph: {
      title: venue.name,
      description,
      ...(venue.image_url ? { images: [{ url: venue.image_url }] } : {}),
    },
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getVenue(id);
  if (!venue) notFound();

  const [
    venueEventItems,
    pastEvents,
    promoters,
    promoterOffers,
    vipPackages,
    relatedVenues,
    drivers,
    supabase,
  ] = await Promise.all([
    listBrowseFeed({ venueId: id, limit: 12 }).catch(() => []),
    listPastEventsByVenue(id).catch(() => []),
    listPromotersForVenue(id).catch(() => []),
    listOffersForVenue(id).catch(() => []),
    listVenueVipPackages(id).catch(() => []),
    listRelatedVenues(venue).catch(() => []),
    listPublishedDrivers({ city: "Houston" }).catch(() => []),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const venuePath = `/venues/${id}`;

  return (
    <article>
      <div className="relative aspect-[21/9] max-h-[440px] w-full bg-wtva-dark-400">
        {venue.image_url ? (
          <Image src={venue.image_url} alt="" fill className="object-cover" unoptimized priority />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-5xl px-4 pt-6 lg:px-8">
          <Link
            href="/venues"
            className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/50"
          >
            ← All venues
          </Link>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-4 pb-6 lg:px-8">
          {venue.venue_type && (
            <span className="inline-flex rounded-full bg-accent-gradient px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-accent">
              {venue.venue_type}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold text-white drop-shadow md:text-5xl">
            {venue.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-white/90">
            {venue.neighborhood && <span>{venue.neighborhood}</span>}
            {venue.rating != null && (
              <span className="text-amber-300">★ {venue.rating}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 lg:px-8">
        <div className="-mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-wtva-dark-300 bg-white p-3 shadow-card">
          <Link
            href={user ? `/check-in?venue=${id}` : `/auth/login?next=${encodeURIComponent(venuePath)}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent-gradient px-6 py-3 text-sm font-semibold text-white shadow-accent"
          >
            Check in (+25 pts)
          </Link>
          <FavoriteButton
            venueId={id}
            initialFavorited={favorited}
            variant="labeled"
          />
          <MessageVenueButton venueId={id} venueName={venue.name} signedIn={!!user} />
          <VenueShareButton venueName={venue.name} venuePath={venuePath} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <VenueQuickInfo venue={venue} />

        <section className="mt-8">
          <h2 className="text-lg font-semibold">About</h2>
          {venue.description ? (
            <p className="mt-3 leading-relaxed text-wtva-muted">{venue.description}</p>
          ) : (
            <p className="mt-3 text-sm text-wtva-muted">
              Venue details coming soon. Follow for updates or message the venue owner.
            </p>
          )}
        </section>

        <VenueDetailsExtra venue={venue} />

        {promoters.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold">Promoters at this venue</h2>
            <p className="mt-2 text-sm text-wtva-muted">
              Book tables and VIP through approved WTVA promoters.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {promoters.map((promoter) => (
                <li key={promoter.user_id}>
                  <VenuePromoterCard promoter={promoter} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {venueEventItems.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold">Upcoming events</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {venueEventItems.map((item) => (
                <BrowseEventCard key={browseItemKey(item)} item={item} />
              ))}
            </div>
          </section>
        )}

        <VenueTablesSection
          venueId={id}
          offers={promoterOffers}
          isSignedIn={!!user}
        />

        <VenueVipPackagesSection packages={vipPackages} isSignedIn={!!user} />

        {pastEvents.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold">Recent events</h2>
            <ul className="mt-4 space-y-2">
              {pastEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="block rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-3 hover:border-wtva-muted"
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-wtva-muted">
                      {formatEventDateTime(event.starts_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {relatedVenues.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold">
              {venue.neighborhood ? `More in ${venue.neighborhood}` : "Related venues"}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedVenues.map((related) => (
                <VenueCard key={related.id} venue={related} />
              ))}
            </div>
          </section>
        )}

        {drivers.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Book a ride</h2>
                <p className="mt-2 text-sm text-wtva-muted">
                  Party buses and private drivers for your night out.
                </p>
              </div>
              <Link href="/drivers" className="text-sm font-medium hover:underline">
                View all drivers
              </Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {drivers.slice(0, 3).map((company) => (
                <DriverCompanyCard key={company.id} company={company} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe, MapPin, Phone, Star, Trophy } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { MessageVenueButton } from "@/components/message-venue-button";
import { BrowseEventCard } from "@/components/browse-event-card";
import { VenueCard } from "@/components/venue-card";
import { DriverCompanyCard } from "@/components/driver-company-card";
import { VenuePromoterCard } from "@/components/venue-promoter-card";
import { VenueShareButton } from "@/components/venue-share-button";
import { VenueTablesSection } from "@/components/venue-tables-section";
import { VenueVipPackagesSection } from "@/components/venue-vip-packages-section";
import { VenueHoursCard } from "@/components/venue-hours-card";
import { getVenue, listRelatedVenues } from "@/lib/data/venues";
import { browseItemKey, listBrowseFeed } from "@/lib/browse-events";
import { listPastEventsByVenue, listVenueVipPackages } from "@/lib/data/events";
import { listOffersForVenue, listPromotersForVenue } from "@/lib/data/promoters";
import { listPublishedDrivers } from "@/lib/data/drivers";
import { formatEventDateTime } from "@/lib/format";
import { openingHoursRows } from "@/lib/types/opening-hours";
import { venueImage } from "@/lib/placeholder";
import { buttonClass } from "@/lib/button";
import { createClient } from "@/lib/supabase/server";

function extractHandle(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    return segments[segments.length - 1]?.replace(/^@/, "") ?? null;
  } catch {
    return null;
  }
}

function displayHost(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  }
}

type BrandIconProps = { className?: string };

function InstagramIcon({ className }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z" />
    </svg>
  );
}

function TikTokIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82A5.7 5.7 0 0 1 15.44 3h-3.02v12.3a2.7 2.7 0 0 1-2.7 2.55 2.7 2.7 0 0 1-2.5-3.72 2.7 2.7 0 0 1 3.35-1.54v-3.08a5.78 5.78 0 0 0-6.5 8.15 5.78 5.78 0 0 0 10.83-2.69V9.01a8.9 8.9 0 0 0 5.05 1.56V7.55a5.7 5.7 0 0 1-3.35-1.73z" />
    </svg>
  );
}

function XIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GlobeIcon({ className }: BrandIconProps) {
  return <Globe className={className} />;
}

type VenueLink = {
  href: string;
  label: string;
  sub?: string;
  Icon: ComponentType<BrandIconProps>;
};

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
  const checkInHref = user
    ? `/check-in?venue=${id}`
    : `/auth/login?next=${encodeURIComponent(venuePath)}`;

  const directionsUrl =
    venue.latitude != null && venue.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
      : venue.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`
        : null;

  const socialSources: { href: string | null; label: string; Icon: ComponentType<BrandIconProps> }[] = [
    { href: venue.instagram_url, label: "Instagram", Icon: InstagramIcon },
    { href: venue.facebook_url, label: "Facebook", Icon: FacebookIcon },
    { href: venue.tiktok_url, label: "TikTok", Icon: TikTokIcon },
    { href: venue.twitter_url, label: "X", Icon: XIcon },
    { href: venue.website_url, label: "Website", Icon: GlobeIcon },
  ];
  const socials: VenueLink[] = socialSources
    .filter((s) => Boolean(s.href?.trim()))
    .map((s) => ({ href: s.href as string, label: s.label, Icon: s.Icon }));

  const hoursRows = openingHoursRows(venue.opening_hours).filter(
    (row) => row.label !== "Hours not set",
  );
  const checkIns = venue.check_in_count ?? 0;

  const igHandle = extractHandle(venue.instagram_url);

  const contactSources: { href: string | null; label: string; sub: string; Icon: ComponentType<BrandIconProps> }[] = [
    {
      href: venue.instagram_url,
      label: "Instagram",
      sub: igHandle ? `@${igHandle}` : "View profile",
      Icon: InstagramIcon,
    },
    {
      href: venue.tiktok_url,
      label: "TikTok",
      sub: extractHandle(venue.tiktok_url)
        ? `@${extractHandle(venue.tiktok_url)}`
        : "View profile",
      Icon: TikTokIcon,
    },
    {
      href: venue.facebook_url,
      label: "Facebook",
      sub: "View page",
      Icon: FacebookIcon,
    },
    {
      href: venue.twitter_url,
      label: "X",
      sub: extractHandle(venue.twitter_url)
        ? `@${extractHandle(venue.twitter_url)}`
        : "View profile",
      Icon: XIcon,
    },
    {
      href: venue.website_url,
      label: "Website",
      sub: displayHost(venue.website_url) ?? "Visit site",
      Icon: GlobeIcon,
    },
  ];
  const contactLinks: VenueLink[] = contactSources
    .filter((link) => Boolean(link.href?.trim()))
    .map((link) => ({ href: link.href as string, label: link.label, sub: link.sub, Icon: link.Icon }));

  return (
    <article className="pb-16">
      {/* Hero */}
      <div className="relative h-[360px] w-full bg-wtva-dark-400 sm:h-[440px]">
        <Image
          src={venueImage(venue.image_url)}
          alt={venue.name}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        <div className="absolute inset-x-0 top-0">
          <div className="mx-auto max-w-6xl px-4 pt-6 lg:px-8">
            <Link
              href="/venues"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/50"
            >
              <ArrowLeft className="h-4 w-4" />
              All venues
            </Link>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-4 pb-8 lg:px-8">
            {venue.venue_type && (
              <span className="inline-flex rounded-full bg-accent-gradient px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-accent">
                {venue.venue_type}
              </span>
            )}
            <h1 className="mt-3 text-3xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl">
              {venue.name}
            </h1>
            {venue.neighborhood && (
              <p className="mt-2 text-sm font-medium text-white/90">
                {venue.neighborhood} · Houston, TX
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {venue.is_open === true && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Open now
                </span>
              )}
              {venue.is_open === false && (
                <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  Closed
                </span>
              )}
              {venue.rating != null && venue.rating > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {venue.rating.toFixed(1)}
                  {checkIns > 0 && (
                    <span className="font-normal text-white/70">
                      ({checkIns.toLocaleString()} check-in{checkIns === 1 ? "" : "s"})
                    </span>
                  )}
                </span>
              )}
              {socials.length > 0 && (
                <div className="flex items-center gap-2">
                  {socials.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating action bar */}
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="relative z-10 -mt-8 flex flex-col gap-4 rounded-2xl border border-wtva-dark-300 bg-white p-4 shadow-card xl:flex-row xl:items-center xl:justify-between xl:gap-6">
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {venue.phone && (
                <a
                  href={`tel:${venue.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 font-medium hover:text-accent"
                >
                  <Phone className="h-4 w-4 shrink-0 text-accent" />
                  {venue.phone}
                </a>
              )}
              {venue.address && (
                <span className="inline-flex items-center gap-2 text-wtva-muted">
                  <MapPin className="h-4 w-4 shrink-0 text-accent" />
                  {venue.address}
                </span>
              )}
            </div>
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 font-semibold text-accent hover:underline"
              >
                Get directions
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:shrink-0 xl:flex-nowrap">
            <Link href={checkInHref} className={buttonClass("primary", "md", "whitespace-nowrap")}>
              Check in (+25 pts)
            </Link>
            <FavoriteButton venueId={id} initialFavorited={favorited} variant="labeled" />
            <MessageVenueButton venueId={id} venueName={venue.name} signedIn={!!user} />
            <VenueShareButton venueName={venue.name} venuePath={venuePath} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 pt-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
          {/* Left column */}
          <div className="space-y-12 lg:col-span-2">
            <section>
              <h2 className="text-xl font-bold">About</h2>
              {venue.description ? (
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-wtva-muted">
                  {venue.description}
                </p>
              ) : (
                <p className="mt-3 text-sm text-wtva-muted">
                  Venue details coming soon. Follow for updates or message the venue owner.
                </p>
              )}
            </section>

            {promoters.length > 0 && (
              <section>
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
              <section>
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-xl font-bold">Upcoming events</h2>
                  <Link
                    href={`/discover/events?venue=${id}`}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    View all events
                  </Link>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {venueEventItems.map((item) => (
                    <BrowseEventCard key={browseItemKey(item)} item={item} />
                  ))}
                </div>
              </section>
            )}

            <VenueTablesSection venueId={id} offers={promoterOffers} isSignedIn={!!user} />

            <VenueVipPackagesSection packages={vipPackages} isSignedIn={!!user} />

            {pastEvents.length > 0 && (
              <section>
                <h2 className="text-xl font-bold">Recent events</h2>
                <ul className="mt-4 space-y-2">
                  {pastEvents.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.id}`}
                        className="block rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-3 transition-colors hover:border-accent"
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
          </div>

          {/* Right sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <VenueHoursCard
              hoursLabel={venue.hours_label}
              isOpen={venue.is_open}
              rows={hoursRows}
            />

            {(venue.phone || venue.address || contactLinks.length > 0) && (
              <div className="rounded-2xl border border-wtva-dark-300 bg-white p-5 shadow-card">
                <h3 className="text-base font-bold">Contact &amp; links</h3>
                <ul className="mt-3 space-y-3 text-sm">
                  {venue.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-accent" />
                      <a
                        href={`tel:${venue.phone.replace(/\s/g, "")}`}
                        className="hover:text-accent"
                      >
                        {venue.phone}
                      </a>
                    </li>
                  )}
                  {venue.address && (
                    <li className="flex items-start gap-2 text-wtva-muted">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {venue.address}
                    </li>
                  )}
                </ul>

                {contactLinks.length > 0 && (
                  <ul className="mt-4 space-y-1 border-t border-wtva-dark-300 pt-3">
                    {contactLinks.map(({ href, label, sub, Icon }) => (
                      <li key={label}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-wtva-dark-400"
                        >
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wtva-dark-300 text-wtva-muted transition-colors group-hover:border-accent group-hover:text-accent">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{label}</span>
                            <span className="block truncate text-xs text-wtva-muted">
                              {sub}
                            </span>
                          </span>
                          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-wtva-subtle" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-wtva-dark-300 bg-white px-5 py-4 text-sm font-semibold shadow-card transition-colors hover:border-accent hover:text-accent"
              >
                <MapPin className="h-4 w-4" />
                Get directions
              </a>
            )}
          </aside>
        </div>

        {/* Related venues */}
        {relatedVenues.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-bold">
                {venue.neighborhood ? `More in ${venue.neighborhood}` : "Related venues"}
              </h2>
              <Link href="/venues" className="text-sm font-semibold text-accent hover:underline">
                View all venues
              </Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedVenues.map((related) => (
                <VenueCard key={related.id} venue={related} />
              ))}
            </div>
          </section>
        )}

        {/* Drivers */}
        {drivers.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Book a ride</h2>
                <p className="mt-2 text-sm text-wtva-muted">
                  Party buses and private drivers for your night out.
                </p>
              </div>
              <Link href="/drivers" className="text-sm font-semibold text-accent hover:underline">
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

        {/* Rewards banner */}
        <section className="mt-16">
          <div className="overflow-hidden rounded-3xl bg-accent-gradient p-8 shadow-accent sm:p-10">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">
                  Earn rewards for living the vibe
                </h2>
                <p className="mt-2 text-sm text-white/85">
                  Check in, invite friends, and complete challenges to level up and unlock
                  exclusive perks at {venue.name}.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={checkInHref}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent"
                >
                  Check in now
                </Link>
                <Link
                  href="/discover"
                  className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

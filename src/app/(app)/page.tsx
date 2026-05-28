import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrowseEventCard } from "@/components/browse-event-card";
import { HeroVideoBackground } from "@/components/hero-video-background";
import { HomeHeroSearch } from "@/components/home-hero-search";
import { SectionHeading } from "@/components/section-heading";
import { VenueCard } from "@/components/venue-card";
import { browseItemKey, listBrowseFeed } from "@/lib/browse-events";
import { getEventTypes } from "@/lib/data/events";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { listVenues } from "@/lib/data/venues";

const HERO_VIDEO_SRC = process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? "/videos/hero.mp4";
const HERO_VIDEO_POSTER =
  process.env.NEXT_PUBLIC_HERO_VIDEO_POSTER ?? "/videos/hero-poster.jpg";

export default async function HomePage() {
  const [featuredItems, upcomingItems, venues, neighborhoods, eventTypes] = await Promise.all([
    listBrowseFeed({ homepageFeaturedOnly: true, limit: 3 }).catch(() => []),
    listBrowseFeed({ limit: 8 }).catch(() => []),
    listVenues().catch(() => []),
    listNeighborhoodOptions().catch(() => []),
    getEventTypes().catch(() => []),
  ]);

  const featuredVenues = venues.filter((v) => v.featured).slice(0, 4);
  const moreVenues = venues.filter((v) => !v.featured).slice(0, 4);
  const displayVenues = featuredVenues.length ? featuredVenues : venues.slice(0, 4);

  return (
    <>
      <section className="relative min-h-[520px] overflow-hidden border-b border-wtva-dark-300">
        <HeroVideoBackground src={HERO_VIDEO_SRC} poster={HERO_VIDEO_POSTER} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-wtva-muted">
            Houston nightlife & events
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Find where the vibes are tonight
          </h1>
          <p className="mt-4 max-w-xl text-lg text-wtva-muted">
            Browse parties, clubs, and experiences. Check in at venues, climb the
            leaderboard, and never miss what&apos;s happening near you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background"
            >
              Open discover <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/discover/events"
              className="inline-flex items-center gap-2 rounded-lg border border-wtva-dark-300 bg-black/20 px-6 py-3 text-sm font-semibold backdrop-blur-sm hover:border-foreground"
            >
              Browse events
            </Link>
          </div>
          <HomeHeroSearch neighborhoods={neighborhoods} eventTypes={eventTypes} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16 space-y-16">
        {featuredItems.length > 0 && (
          <section>
            <SectionHeading
              title="Featured events"
              subtitle="Sponsored placements"
              href="/discover/events?featured=1"
            />
            <div className="grid gap-6 lg:grid-cols-1">
              {featuredItems.map((item) => (
                <BrowseEventCard key={browseItemKey(item)} item={item} large />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeading
            title="Upcoming events"
            subtitle="What's on the calendar"
            href="/discover/events"
          />
          {upcomingItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingItems.map((item) => (
                <BrowseEventCard key={browseItemKey(item)} item={item} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-wtva-dark-300 py-16 text-center text-wtva-muted">
              No upcoming events yet. Check back soon or explore venues below.
            </p>
          )}
        </section>

        <section>
          <SectionHeading
            title="Venues"
            subtitle="Clubs, lounges, and nightlife spots"
            href="/venues"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayVenues.map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
          {moreVenues.length > 0 && featuredVenues.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {moreVenues.map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold">Earn points every time you go out</h2>
          <p className="mx-auto mt-3 max-w-md text-wtva-muted">
            Check in at venues, climb from Vibee to Influencer, and compete on the city leaderboard.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/register"
              className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background"
            >
              Join free
            </Link>
            <Link
              href="/ranking"
              className="rounded-lg border border-wtva-dark-300 px-6 py-3 text-sm font-semibold"
            >
              View rankings
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrowseEventCard } from "@/components/browse-event-card";
import { HeroVideoBackground } from "@/components/hero-video-background";
import { HomeHeroSearch } from "@/components/home-hero-search";
import { SectionHeading } from "@/components/section-heading";
import { VenueCard } from "@/components/venue-card";
import { browseItemKey, listBrowseFeed, listHomepageFeaturedItems } from "@/lib/browse-events";
import { getEventTypes } from "@/lib/data/events";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { listVenues } from "@/lib/data/venues";

const HERO_VIDEO_SRC =
  process.env.NEXT_PUBLIC_HERO_VIDEO_URL?.trim() || "/videos/hero.mp4";
const HERO_VIDEO_POSTER =
  process.env.NEXT_PUBLIC_HERO_VIDEO_POSTER?.trim() || "/videos/hero-poster.jpg";

export default async function HomePage() {
  const [featuredItems, upcomingItems, venues, neighborhoods, eventTypes] = await Promise.all([
    listHomepageFeaturedItems(3).catch(() => []),
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
          <p className="text-sm font-semibold uppercase tracking-widest text-white/75">
            Houston nightlife &amp; events
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Discover where Houston is going{" "}
            <span className="text-accent-gradient italic">tonight.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            The best events, clubs, lounges and experiences — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-full bg-accent-gradient px-6 py-3 text-sm font-semibold text-white shadow-accent"
            >
              Open discover <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/discover/events"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        <section className="relative overflow-hidden rounded-3xl bg-accent-gradient p-8 text-center text-white shadow-accent md:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <h2 className="text-2xl font-bold md:text-3xl">Earn rewards for living the vibe</h2>
            <p className="mx-auto mt-3 max-w-md text-white/85">
              Check in at venues, climb from Vibee to Influencer, and compete on the city leaderboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth/register"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent shadow-sm hover:bg-white/90"
              >
                Join now
              </Link>
              <Link
                href="/ranking"
                className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                View leaderboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

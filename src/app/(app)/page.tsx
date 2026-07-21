import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";
import { BrowseEventCard } from "@/components/browse-event-card";
import { HeroVideoBackground } from "@/components/hero-video-background";
import { HomeBusinessSection } from "@/components/home-business-section";
import { HomeConciergeBanner } from "@/components/home-concierge-banner";
import { HomeHeroSearch } from "@/components/home-hero-search";
import { HomeRewardsSection } from "@/components/home-rewards-section";
import { HomeDiscoverTabs } from "@/components/home-discover-tabs";
import { HomeTonightCategories } from "@/components/home-tonight-categories";
import { VenueCard } from "@/components/venue-card";
import { HeroCitySelect } from "@/components/hero-city-select";
import { browseItemKey, listBrowseFeed, listHomepageFeaturedItems } from "@/lib/browse-events";
import { getBusinessPortalUrl } from "@/lib/business-portal-url";
import { buttonClass } from "@/lib/button";
import { DEFAULT_CITY } from "@/lib/cities";
import { getEventTypes } from "@/lib/data/events";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { getMyRanking } from "@/lib/data/rankings";
import { listVenues } from "@/lib/data/venues";
import { createClient } from "@/lib/supabase/server";

const HERO_VIDEO_SRC =
  process.env.NEXT_PUBLIC_HERO_VIDEO_URL?.trim() || "/videos/hero.mp4";
const HERO_VIDEO_POSTER =
  process.env.NEXT_PUBLIC_HERO_VIDEO_POSTER?.trim() || "/videos/hero-poster.jpg";

export default async function HomePage() {
  const host = (await headers()).get("host");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [featuredItems, upcomingItems, venues, neighborhoods, eventTypes, ranking] =
    await Promise.all([
      listHomepageFeaturedItems(8).catch(() => []),
      listBrowseFeed({ limit: 4 }).catch(() => []),
      listVenues().catch(() => []),
      listNeighborhoodOptions().catch(() => []),
      getEventTypes().catch(() => []),
      user ? getMyRanking(user.id).catch(() => null) : Promise.resolve(null),
    ]);

  const featuredTonight = featuredItems.length > 0 ? featuredItems : upcomingItems;
  const featuredVenues = venues.filter((v) => v.featured).slice(0, 4);
  const displayVenues = featuredVenues.length ? featuredVenues : venues.slice(0, 4);

  return (
    <>
      <section className="relative min-h-[520px] overflow-hidden border-b border-wtva-dark-300">
        <HeroVideoBackground src={HERO_VIDEO_SRC} poster={HERO_VIDEO_POSTER} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 pb-28 md:pb-16 lg:px-8 lg:py-24">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Discover where <HeroCitySelect current={DEFAULT_CITY} /> is going{" "}
            <span className="text-accent-gradient italic">tonight.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            Find events, clubs, VIP experiences, and rides—all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/discover" className={buttonClass("primary", "lg")}>
              Explore Tonight <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/for-business" className={buttonClass("onDark", "lg")}>
              For Business
            </Link>
          </div>
          <HomeHeroSearch neighborhoods={neighborhoods} eventTypes={eventTypes} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 lg:px-8 lg:py-16">
        <HomeTonightCategories />

        <HomeDiscoverTabs
          featured={
            featuredTonight.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredTonight.slice(0, 4).map((item) => (
                  <BrowseEventCard key={browseItemKey(item)} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-wtva-dark-300 py-16 text-center text-wtva-muted">
                No featured events yet. Check back soon or explore Discover.
              </p>
            )
          }
          upcoming={
            upcomingItems.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {upcomingItems.slice(0, 4).map((item) => (
                  <BrowseEventCard key={browseItemKey(item)} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-wtva-dark-300 py-16 text-center text-wtva-muted">
                No upcoming events yet. Check back soon or explore venues.
              </p>
            )
          }
          venues={
            displayVenues.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {displayVenues.map((v) => (
                  <VenueCard key={v.id} venue={v} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-wtva-dark-300 py-16 text-center text-wtva-muted">
                No venues listed yet. Check back soon.
              </p>
            )
          }
        />

        <HomeConciergeBanner />

        <HomeBusinessSection
          venueRegisterUrl={getBusinessPortalUrl("/auth/register", host)}
          promoterRegisterUrl={getBusinessPortalUrl("/auth/register?role=promoter", host)}
          driverRegisterUrl={getBusinessPortalUrl("/auth/register?role=driver", host)}
        />

        <HomeRewardsSection points={ranking?.points ?? null} />
      </div>
    </>
  );
}

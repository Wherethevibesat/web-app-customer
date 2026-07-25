import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Cake, Gem, Heart, Plane, Users } from "lucide-react";
import { HomeVibeTabs } from "@/components/home-vibe-tabs";
import { buttonClass } from "@/lib/button";
import { EVENT_PLACEHOLDER } from "@/lib/placeholder";
import { listPublishedNightPackages } from "@/lib/data/night-packages";
import {
  matchesOccasionVibe,
  toPackageCard,
} from "@/lib/data/night-packages-shared";
import { OCCASION_VIBES, vibeCopy } from "@/lib/vibe-copy";

const OCCASION_ICONS = {
  date_night: Heart,
  girls_night: Users,
  birthday: Cake,
  out_of_town: Plane,
  luxury: Gem,
} as const;

/** Homepage vibes — Pick your vibe / Curated Vibes tabs. */
export async function HomeBuildYourNight() {
  const packages = await listPublishedNightPackages().catch(() => []);
  const featured = packages.filter((p) => p.is_featured);
  const show = (featured.length ? featured : packages).slice(0, 5).map(toPackageCard);

  const occasionLinks = OCCASION_VIBES.map((vibe) => {
    const match = packages.find((p) => matchesOccasionVibe(p, vibe.key));
    return {
      ...vibe,
      href: match
        ? `/packages/${match.slug || match.id}`
        : `/packages?vibe=${vibe.key}`,
      icon: OCCASION_ICONS[vibe.key],
    };
  });

  const pickPanel = (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {occasionLinks.map(({ key, title, href, icon: Icon, overlay }) => (
        <li key={key}>
          <Link
            href={href}
            className="group relative block overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="relative aspect-[4/5] bg-wtva-dark-400">
              <Image
                src={EVENT_PLACEHOLDER}
                alt=""
                fill
                className="object-cover transition-transform group-hover:scale-[1.03]"
                unoptimized
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${overlay}`} />
              <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent-gradient text-white shadow-accent">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <p className="absolute bottom-3 left-14 right-3 text-sm font-bold text-white drop-shadow">
                {title}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );

  const curatedPanel =
    show.length > 0 ? (
      <ul className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {show.map((pkg) => (
          <li
            key={pkg.id}
            className="w-[260px] shrink-0 snap-start sm:w-[280px]"
          >
            <Link
              href={`/packages/${pkg.slug || pkg.id}`}
              className="group block overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-card shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="relative aspect-[4/5] bg-wtva-dark-400">
                <Image
                  src={pkg.image_url || EVENT_PLACEHOLDER}
                  alt=""
                  fill
                  className="object-cover transition-transform group-hover:scale-[1.03]"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                {pkg.is_featured && (
                  <span className="absolute left-3 top-3 rounded-full bg-accent-gradient px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    {vibeCopy.featuredBadge}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-lg font-bold text-white drop-shadow">
                    {pkg.title}
                  </p>
                  {pkg.tagline && (
                    <p className="mt-1 line-clamp-2 text-xs text-white/85">
                      {pkg.tagline}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-white">
                    {vibeCopy.viewVibe} →
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6">
        <p className="font-semibold">{vibeCopy.curatedTitle}</p>
        <p className="mt-1 text-sm text-wtva-muted">{vibeCopy.emptyBrowse}</p>
        <Link href="/packages" className={buttonClass("primary", "md", "mt-4")}>
          {vibeCopy.buildMyVibe} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );

  return <HomeVibeTabs pick={pickPanel} curated={curatedPanel} />;
}

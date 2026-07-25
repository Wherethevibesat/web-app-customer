import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Cake,
  Gem,
  Heart,
  Plane,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { buttonClass } from "@/lib/button";
import { formatPrice } from "@/lib/format";
import { EVENT_PLACEHOLDER } from "@/lib/placeholder";
import { listPublishedNightPackages, slotTypeLabel } from "@/lib/data/night-packages";

const VIBES = [
  {
    title: "Date Night",
    href: "/packages",
    icon: Heart,
    overlay: "from-rose-900/80 via-fuchsia-900/35 to-transparent",
  },
  {
    title: "Girls Night Out",
    href: "/packages",
    icon: Users,
    overlay: "from-violet-950/85 via-purple-800/40 to-transparent",
  },
  {
    title: "Birthday Celebration",
    href: "/packages",
    icon: Cake,
    overlay: "from-amber-950/80 via-fuchsia-900/35 to-transparent",
  },
  {
    title: "Out of Town Weekend",
    href: "/packages",
    icon: Plane,
    overlay: "from-slate-950/85 via-indigo-900/40 to-transparent",
  },
  {
    title: "Luxury Experience",
    href: "/packages",
    icon: Gem,
    overlay: "from-neutral-950/85 via-violet-900/45 to-transparent",
  },
] as const;

/** Mid-page “Plan your night” vibes + live package templates when available. */
export async function HomeBuildYourNight() {
  const packages = await listPublishedNightPackages().catch(() => []);
  const featured = packages.filter((p) => p.is_featured).slice(0, 3);
  const show = featured.length ? featured : packages.slice(0, 3);

  // Prefer linking Out of Town vibe to the demo package when seeded.
  const outOfTown =
    packages.find((p) => p.slug === "out-of-town-weekend-demo") ??
    packages.find((p) => /out of town|weekend/i.test(p.title));

  const vibes = VIBES.map((v) =>
    v.title === "Out of Town Weekend" && outOfTown
      ? { ...v, href: `/packages/${outOfTown.slug || outOfTown.id}` }
      : v,
  );

  return (
    <section className="space-y-8">
      <div>
        <SectionHeading
          title="Plan your night. Your way."
          subtitle="Pick a vibe or let our concierge build it for you."
          href="/packages"
          linkLabel="See all plans"
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {vibes.map(({ title, href, icon: Icon, overlay }) => (
            <li key={title}>
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
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${overlay}`}
                  />
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
      </div>

      {show.length > 0 && (
        <div className="rounded-3xl border border-wtva-dark-300 bg-gradient-to-br from-white via-white to-fuchsia-50/60 p-6 shadow-card md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Templates
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-tight md:text-2xl">
                Ready-to-book nights
              </h3>
              <p className="mt-2 max-w-xl text-sm text-wtva-muted">
                Curated multi-stop plans — customize stops, then pay once.
              </p>
            </div>
            <Link href="/packages" className={buttonClass("primary", "md")}>
              Build My Night <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {show.map((pkg) => {
              const chain = (pkg.stops ?? [])
                .map((s) => (s.stop_offer ? slotTypeLabel(s.stop_offer.slot_type) : null))
                .filter(Boolean)
                .join(" → ");
              return (
                <li key={pkg.id}>
                  <Link
                    href={`/packages/${pkg.slug || pkg.id}`}
                    className="block h-full rounded-2xl border border-wtva-dark-300 bg-white/80 px-4 py-4 transition hover:border-accent/40"
                  >
                    <p className="font-semibold">{pkg.title}</p>
                    {chain && (
                      <p className="mt-1 line-clamp-2 text-xs text-wtva-muted">{chain}</p>
                    )}
                    <p className="mt-3 text-sm font-bold">
                      From {formatPrice((pkg.subtotal_cents ?? 0) / 100)}
                      <span className="font-normal text-wtva-muted"> / person</span>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

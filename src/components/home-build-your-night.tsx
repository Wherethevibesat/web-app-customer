import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/lib/button";
import { formatPrice } from "@/lib/format";
import { listPublishedNightPackages, slotTypeLabel } from "@/lib/data/night-packages";

export async function HomeBuildYourNight() {
  const packages = await listPublishedNightPackages().catch(() => []);
  const featured = packages.filter((p) => p.is_featured).slice(0, 3);
  const show = featured.length ? featured : packages.slice(0, 3);

  return (
    <section className="rounded-3xl border border-wtva-dark-300 bg-gradient-to-br from-white via-white to-fuchsia-50/60 p-6 shadow-card md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Plan</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Build Your Night
          </h2>
          <p className="mt-2 max-w-xl text-wtva-muted">
            Pick a template, swap or add experiences, and pay once for the whole flow.
          </p>
        </div>
        <Link href="/packages" className={buttonClass("primary", "md")}>
          Plan my night <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {show.length > 0 && (
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
                    <p className="mt-1 text-xs text-wtva-muted line-clamp-2">{chain}</p>
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
      )}
    </section>
  );
}

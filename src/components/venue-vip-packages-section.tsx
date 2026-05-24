import Link from "next/link";
import type { VenueVipPackage } from "@/lib/data/events";
import { formatPrice } from "@/lib/format";

export function VenueVipPackagesSection({
  packages,
  isSignedIn,
}: {
  packages: VenueVipPackage[];
  isSignedIn: boolean;
}) {
  if (packages.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold">VIP packages</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {packages.map((pkg) => (
          <li
            key={pkg.id}
            className="flex flex-col rounded-xl border border-wtva-dark-300 bg-wtva-card p-5"
          >
            <p className="font-semibold">{pkg.package_name}</p>
            <Link
              href={`/events/${pkg.event_id}`}
              className="text-xs text-wtva-muted hover:underline"
            >
              {pkg.event_title}
            </Link>
            <p className="mt-2 text-lg font-bold">{formatPrice(pkg.price)}</p>
            {pkg.description && (
              <p className="mt-2 flex-1 text-sm text-wtva-muted">{pkg.description}</p>
            )}
            <Link
              href={
                isSignedIn
                  ? `/checkout/${pkg.id}`
                  : `/auth/login?next=${encodeURIComponent(`/checkout/${pkg.id}`)}`
              }
              className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2.5 text-center text-sm font-semibold text-background"
            >
              Buy VIP
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

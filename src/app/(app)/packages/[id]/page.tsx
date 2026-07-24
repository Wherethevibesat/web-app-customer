import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { buttonClass } from "@/lib/button";
import { formatPrice } from "@/lib/format";
import {
  getPublishedNightPackage,
  slotTypeLabel,
} from "@/lib/data/night-packages";
import { createClient } from "@/lib/supabase/server";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getPublishedNightPackage(id).catch(() => null);
  if (!pkg) notFound();

  const stops = pkg.stops ?? [];
  const perPerson = (pkg.subtotal_cents ?? 0) / 100;
  const planHref = `/packages/${pkg.id}/plan`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bookHref = user
    ? planHref
    : `/auth/login?next=${encodeURIComponent(planHref)}`;

  return (
    <PageShell title={pkg.title} subtitle={pkg.subtitle || undefined} width="narrow">
      {pkg.image_url && (
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image
            src={pkg.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            priority
            unoptimized
          />
        </div>
      )}

      {pkg.description && (
        <p className="text-wtva-muted whitespace-pre-wrap">{pkg.description}</p>
      )}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5">
        <div>
          <p className="text-sm text-wtva-muted">From</p>
          <p className="text-2xl font-bold">
            {formatPrice(perPerson)}
            <span className="ml-1 text-sm font-normal text-wtva-muted">/ person</span>
          </p>
          <p className="mt-1 text-xs text-wtva-muted">
            Party size {pkg.party_size_min}–{pkg.party_size_max} · one checkout for the whole night
          </p>
        </div>
        <Link href={bookHref} className={buttonClass("primary", "lg")}>
          Customize & book
        </Link>
      </div>

      <h2 className="mt-10 text-lg font-bold">Your itinerary</h2>
      <ol className="mt-4 space-y-3">
        {stops.map((stop, index) => {
          const offer = stop.stop_offer;
          if (!offer) return null;
          return (
            <li
              key={stop.id}
              className="rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Stop {index + 1}
                    {stop.scheduled_label ? ` · ${stop.scheduled_label}` : ""}
                  </p>
                  <p className="mt-1 font-semibold">{offer.title}</p>
                  <p className="text-sm text-wtva-muted">
                    {offer.venue?.name ?? "Venue"} · {slotTypeLabel(offer.slot_type)}
                    {offer.arrival_window ? ` · ${offer.arrival_window}` : ""}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(offer.price_cents / 100)}</p>
              </div>
              {offer.inclusions?.length > 0 && (
                <ul className="mt-3 list-inside list-disc text-sm text-wtva-muted">
                  {offer.inclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <Link
        href="/packages"
        className="mt-8 inline-block text-sm text-wtva-muted underline hover:text-foreground"
      >
        ← All packages
      </Link>
    </PageShell>
  );
}

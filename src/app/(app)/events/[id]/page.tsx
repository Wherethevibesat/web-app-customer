import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Repeat } from "lucide-react";
import { getEvent, listEventVipPackages } from "@/lib/data/events";
import { eventImage } from "@/lib/placeholder";
import { buttonClass } from "@/lib/button";
import { formatRecurringSchedule, getEventSeries } from "@/lib/data/event-series";
import { listOffersForEvent } from "@/lib/data/promoters";
import { PromoterOffersSection } from "@/components/promoter-offers-section";
import {
  listEventTicketTiers,
  userRegistrationForEvent,
} from "@/lib/data/event-tickets";
import { formatEventDateTime, formatPrice } from "@/lib/format";
import { getPublishableKey } from "@/lib/stripe/server";
import { EventTicketsSection } from "@/components/event-tickets-section";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? `${event.event_type} event`,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [vipPackages, promoterOffers, seriesData] = await Promise.all([
    listEventVipPackages(id),
    listOffersForEvent(id),
    event.series_id ? getEventSeries(event.series_id) : Promise.resolve(null),
  ]);
  const ticketTiers = await listEventTicketTiers(id);
  const publishableKey = await getPublishableKey();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const existingRegistration = user
    ? await userRegistrationForEvent(user.id, id)
    : null;
  const registeredTierName =
    existingRegistration?.event_ticket_tiers &&
    (Array.isArray(existingRegistration.event_ticket_tiers)
      ? existingRegistration.event_ticket_tiers[0]?.name
      : (existingRegistration.event_ticket_tiers as { name: string }).name);

  return (
    <article>
      <div className="relative aspect-[21/9] max-h-[420px] w-full bg-wtva-dark-400">
        <Image src={eventImage(event.image_url)} alt="" fill className="object-cover" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-wtva-dark-300 px-3 py-1 text-xs font-medium">
            {event.event_type}
          </span>
          {event.featured && (
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
              Featured
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-bold md:text-4xl">{event.title}</h1>
        <p className="mt-3 text-lg text-wtva-muted">
          {formatEventDateTime(event.starts_at, event.ends_at)}
        </p>

        {seriesData && (
          <Link
            href={`/events/series/${seriesData.series.id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-2.5 text-sm hover:border-wtva-muted"
          >
            <Repeat className="h-4 w-4 shrink-0" />
            <span>
              Repeats {formatRecurringSchedule(seriesData.series.recurrence).toLowerCase()}
              <span className="text-wtva-muted"> · View all dates</span>
            </span>
          </Link>
        )}

        {(event.neighborhood || event.venue) && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {event.venue && (
              <Link
                href={`/venues/${event.venue.id}`}
                className="inline-flex items-center gap-1 font-medium hover:underline"
              >
                <MapPin className="h-4 w-4" />
                {event.venue.name}
              </Link>
            )}
            {event.neighborhood && (
              <span className="text-wtva-muted">{event.neighborhood}</span>
            )}
          </div>
        )}

        {event.description && (
          <div className="mt-8 prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-wtva-muted leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          {event.venue_id && (
            <Link
              href={user ? `/check-in?venue=${event.venue_id}` : `/auth/login?next=/events/${id}`}
              className={buttonClass("primary", "lg")}
            >
              Check in at venue
            </Link>
          )}
          {event.venue && (
            <Link href={`/venues/${event.venue.id}`} className={buttonClass("secondary", "lg")}>
              View venue
            </Link>
          )}
        </div>

        <EventTicketsSection
          eventId={id}
          tiers={ticketTiers}
          publishableKey={publishableKey}
          isSignedIn={Boolean(user)}
          existingRegistration={
            registeredTierName ? { tierName: registeredTierName } : null
          }
        />

        <PromoterOffersSection
          eventId={id}
          offers={promoterOffers}
          isSignedIn={Boolean(user)}
        />

        {vipPackages.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold">VIP packages</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {vipPackages.map((pkg) => (
                <li
                  key={pkg.id}
                  className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 flex flex-col"
                >
                  <p className="font-semibold">{pkg.package_name}</p>
                  <p className="mt-1 text-lg font-bold">{formatPrice(Number(pkg.price))}</p>
                  {pkg.description && (
                    <p className="mt-2 text-sm text-wtva-muted flex-1">{pkg.description}</p>
                  )}
                  <Link
                    href={user ? `/checkout/${pkg.id}` : `/auth/login?next=/checkout/${pkg.id}`}
                    className={buttonClass("primary", "md", "mt-4 w-full")}
                  >
                    Buy VIP
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

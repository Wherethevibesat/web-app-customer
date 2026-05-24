import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Megaphone } from "lucide-react";
import {
  listEventsForPromoterPublic,
  listOffersByPromoter,
  listVenuesForPromoter,
  resolvePromoterProfile,
} from "@/lib/data/promoters";
import { PromoterProfileContactForm } from "@/components/promoter-profile-contact-form";
import { PromoterProfileOffers } from "@/components/promoter-profile-offers";
import { createClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/format";

export default async function PromoterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await resolvePromoterProfile(id);
  if (!profile) notFound();

  const [offers, venues, events, supabase] = await Promise.all([
    listOffersByPromoter(profile.user_id),
    listVenuesForPromoter(profile.user_id),
    listEventsForPromoterPublic(profile.user_id),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <Link href="/promoters" className="text-sm text-wtva-muted hover:text-foreground">
        ← All promoters
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        {profile.profile_image_url ? (
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-wtva-dark-300">
            <Image
              src={profile.profile_image_url}
              alt={profile.display_name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-wtva-dark-300 bg-wtva-dark-400">
            <Megaphone className="h-10 w-10 text-foreground" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          {profile.bio && (
            <p className="mt-3 text-wtva-muted leading-relaxed">{profile.bio}</p>
          )}
          {profile.contact_phone && (
            <p className="mt-3 text-sm text-wtva-muted">{profile.contact_phone}</p>
          )}
        </div>
      </div>

      {venues.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Partner venues</h2>
          <ul className="mt-4 space-y-2">
            {venues.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/venues/${v.id}`}
                  className="flex items-center justify-between rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm hover:border-wtva-muted"
                >
                  <span className="font-medium">{v.name}</span>
                  {v.neighborhood && (
                    <span className="text-wtva-muted">{v.neighborhood}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold">Upcoming events</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-wtva-muted">No upcoming events listed.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-3 hover:border-wtva-muted"
                >
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-wtva-muted">
                    {formatEventDateTime(event.starts_at)}
                    {event.venue_name ? ` · ${event.venue_name}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Tables & VIP offers</h2>
        <div className="mt-4">
          <PromoterProfileOffers offers={offers} isSignedIn={!!user} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Contact {profile.display_name}</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Ask about tables, VIP, or a specific night.
        </p>
        <div className="mt-4 rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <PromoterProfileContactForm
            promoterId={profile.user_id}
            promoterName={profile.display_name}
            isSignedIn={!!user}
          />
        </div>
      </section>
    </article>
  );
}

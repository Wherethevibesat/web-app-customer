import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Repeat } from "lucide-react";
import {
  formatRecurringSchedule,
  getEventSeries,
} from "@/lib/data/event-series";
import { formatEventDate, formatEventDateTime, formatEventTime } from "@/lib/format";
import { eventImage } from "@/lib/placeholder";
import { buttonClass } from "@/lib/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getEventSeries(id);
  if (!data) return { title: "Event series not found" };
  return {
    title: data.series.title,
    description:
      data.series.description?.slice(0, 160) ??
      `${formatRecurringSchedule(data.series.recurrence)} · ${data.series.event_type}`,
  };
}

export default async function EventSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEventSeries(id);
  if (!data) notFound();

  const { series, upcoming } = data;
  const schedule = formatRecurringSchedule(series.recurrence);
  const heroImage = eventImage(series.image_url ?? series.nextOccurrence.image_url);

  return (
    <article>
      <div className="relative aspect-[21/9] max-h-[420px] w-full bg-wtva-dark-400">
        <Image src={heroImage} alt="" fill className="object-cover" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-wtva-dark-300 px-3 py-1 text-xs font-medium">
            <Repeat className="h-3 w-3" />
            {schedule}
          </span>
          <span className="rounded-full border border-wtva-dark-300 px-3 py-1 text-xs font-medium">
            {series.event_type}
          </span>
          {series.featured && (
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
              Featured
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-bold md:text-4xl">{series.title}</h1>
        <p className="mt-3 text-lg text-wtva-muted">
          Next: {formatEventDate(series.nextOccurrence.starts_at)} ·{" "}
          {formatEventTime(series.nextOccurrence.starts_at)}
        </p>

        {(series.neighborhood || series.venue) && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {series.venue && (
              <Link
                href={`/venues/${series.venue.id}`}
                className="inline-flex items-center gap-1 font-medium hover:underline"
              >
                <MapPin className="h-4 w-4" />
                {series.venue.name}
              </Link>
            )}
            {series.neighborhood && (
              <span className="text-wtva-muted">{series.neighborhood}</span>
            )}
          </div>
        )}

        {series.description && (
          <p className="mt-8 whitespace-pre-wrap text-wtva-muted leading-relaxed">
            {series.description}
          </p>
        )}

        <section className="mt-12">
          <h2 className="text-xl font-bold">Upcoming dates</h2>
          <p className="mt-2 text-sm text-wtva-muted">
            Pick a date to view tickets and details for that night.
          </p>
          <ul className="mt-6 space-y-2">
            {upcoming.map((occurrence) => (
              <li key={occurrence.id}>
                <Link
                  href={`/events/${occurrence.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-3 hover:border-wtva-muted"
                >
                  <span className="font-medium">
                    {formatEventDate(occurrence.starts_at)} ·{" "}
                    {formatEventTime(occurrence.starts_at)}
                  </span>
                  <span className="text-sm text-wtva-muted">
                    {formatEventDateTime(occurrence.starts_at, occurrence.ends_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <Link href={`/events/${series.nextOccurrence.id}`} className={buttonClass("primary", "lg")}>
            View next date
          </Link>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Repeat } from "lucide-react";
import type { EventSeriesBrowse } from "@/lib/data/event-series";
import { formatRecurringSchedule } from "@/lib/data/event-series";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { eventImage } from "@/lib/placeholder";

export function EventSeriesCard({
  series,
  large,
}: {
  series: EventSeriesBrowse;
  large?: boolean;
}) {
  const schedule = formatRecurringSchedule(series.recurrence);
  const next = series.nextOccurrence;

  return (
    <Link
      href={`/events/series/${series.id}`}
      className={`group block overflow-hidden rounded-xl border border-wtva-dark-300 bg-wtva-card transition-all hover:border-wtva-muted hover:shadow-lg ${
        large ? "flex flex-row" : ""
      }`}
    >
      <div
        className={`relative shrink-0 bg-wtva-dark-400 ${
          large ? "w-2/5 min-h-[140px] self-stretch" : "aspect-[16/10]"
        }`}
      >
        <Image
          src={eventImage(series.image_url ?? next.image_url)}
          alt=""
          fill
          className="object-cover transition-transform group-hover:scale-[1.02]"
          unoptimized
        />
        {series.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-gradient px-2.5 py-0.5 text-xs font-bold text-white shadow-accent">
            Featured
          </span>
        )}
      </div>
      <div className={`min-w-0 p-4 ${large ? "flex flex-1 flex-col justify-center sm:p-5" : "p-5"}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-wtva-muted">
          {schedule} · Next: {formatEventDate(next.starts_at)} · {formatEventTime(next.starts_at)}
        </p>
        <h3 className={`mt-1 font-bold group-hover:underline ${large ? "text-base sm:text-lg" : "text-lg"}`}>
          {series.title}
        </h3>
        {series.venue?.name && (
          <p className="mt-1 text-sm text-wtva-muted">
            at {series.venue.name}
            {series.neighborhood || series.venue.neighborhood
              ? ` · ${series.neighborhood ?? series.venue.neighborhood}`
              : ""}
          </p>
        )}
        {series.description && !large && (
          <p className="mt-2 line-clamp-2 text-sm text-wtva-subtle">{series.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            <Repeat className="h-3 w-3" aria-hidden />
            {series.event_type}
          </span>
        </div>
      </div>
    </Link>
  );
}

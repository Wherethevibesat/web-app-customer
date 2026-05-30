import Link from "next/link";
import Image from "next/image";
import { Calendar, Repeat } from "lucide-react";
import type { EventSeriesBrowse } from "@/lib/data/event-series";
import { formatRecurringSchedule } from "@/lib/data/event-series";
import { formatEventDate, formatEventTime } from "@/lib/format";

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
        {(series.image_url ?? next.image_url) ? (
          <Image
            src={series.image_url ?? next.image_url!}
            alt=""
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="flex h-full min-h-[140px] items-center justify-center text-wtva-subtle">
            <Calendar className="h-12 w-12 opacity-40" />
          </div>
        )}
        {series.featured && (
          <span className="absolute left-3 top-3 rounded bg-foreground px-2 py-0.5 text-xs font-bold text-background">
            Featured
          </span>
        )}
        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs font-medium backdrop-blur">
          <Repeat className="h-3 w-3" />
          {series.event_type}
        </span>
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
      </div>
    </Link>
  );
}

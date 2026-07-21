import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/data/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { eventImage } from "@/lib/placeholder";

export function EventCard({ event, large }: { event: Event; large?: boolean }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className={`group block overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${
        large ? "flex flex-row" : ""
      }`}
    >
      <div
        className={`relative shrink-0 bg-wtva-dark-400 ${
          large ? "w-2/5 min-h-[140px] self-stretch" : "aspect-[16/10]"
        }`}
      >
        <Image
          src={eventImage(event.image_url)}
          alt=""
          fill
          className="object-cover transition-transform group-hover:scale-[1.02]"
          unoptimized
        />
        {event.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-gradient px-2.5 py-0.5 text-xs font-bold text-white shadow-accent">
            Featured
          </span>
        )}
      </div>
      <div className={`min-w-0 p-4 ${large ? "flex flex-1 flex-col justify-center sm:p-5" : "p-5"}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-wtva-muted">
          {formatEventDate(event.starts_at)} · {formatEventTime(event.starts_at)}
        </p>
        <h3 className={`mt-1 font-bold group-hover:underline ${large ? "text-base sm:text-lg" : "text-lg"}`}>
          {event.title}
        </h3>
        {event.venue?.name && (
          <p className="mt-1 text-sm text-wtva-muted">
            at {event.venue.name}
            {event.neighborhood || event.venue.neighborhood
              ? ` · ${event.neighborhood ?? event.venue.neighborhood}`
              : ""}
          </p>
        )}
        {event.description && !large && (
          <p className="mt-2 line-clamp-2 text-sm text-wtva-subtle">{event.description}</p>
        )}
        {event.event_type && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              {event.event_type}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

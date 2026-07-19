import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";
import type { Event } from "@/lib/data/events";
import { formatEventDate, formatEventTime } from "@/lib/format";

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
        {event.image_url ? (
          <Image
            src={event.image_url}
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
        {event.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-gradient px-2.5 py-0.5 text-xs font-bold text-white shadow-accent">
            Featured
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          {event.event_type}
        </span>
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
      </div>
    </Link>
  );
}

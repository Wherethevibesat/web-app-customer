"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

type ReelPhoto = { src: string; href?: string; placeholder?: boolean };

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function VenuePhotoReel({
  photos,
  instagramUrl,
  handle,
}: {
  photos: ReelPhoto[];
  instagramUrl: string | null;
  handle: string | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    scroller.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  }

  if (photos.length === 0) return null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Photos</h2>
          {instagramUrl && (
            <p className="mt-1 text-sm text-wtva-muted">
              Latest from{" "}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent hover:underline"
              >
                {handle ? `@${handle}` : "Instagram"}
              </a>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
            >
              View on Instagram
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-wtva-dark-300 text-wtva-muted transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-wtva-dark-300 text-wtva-muted transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, i) => {
          const tile = photo.placeholder ? (
            <div className="flex aspect-square w-52 shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-wtva-dark-300 bg-wtva-dark-400 p-4 text-center shadow-card sm:w-56">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-gradient text-white shadow-accent">
                <InstagramGlyph className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-wtva-muted">
                {instagramUrl ? "View on Instagram" : "Photos coming soon"}
              </span>
            </div>
          ) : (
            <div className="group relative aspect-square w-52 shrink-0 snap-start overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-dark-400 shadow-card sm:w-56">
              <Image
                src={photo.src}
                alt=""
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          );

          const href = photo.href ?? (photo.placeholder ? instagramUrl : null);
          return href ? (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl"
            >
              {tile}
            </a>
          ) : (
            <div key={i}>{tile}</div>
          );
        })}
      </div>
    </section>
  );
}

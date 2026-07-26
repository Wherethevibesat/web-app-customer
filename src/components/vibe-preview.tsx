import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/lib/button";
import { formatPrice } from "@/lib/format";
import type { NightPackage } from "@/lib/data/night-packages";
import { vibeCopy } from "@/lib/vibe-copy";
import { VibeFlowSteps } from "@/components/vibe-flow-steps";
import { VibePreviewStops } from "@/components/vibe-preview-stops";

/** Screen 1 — fall in love. Card layout aligned with Build. */
export function VibePreview({ pkg }: { pkg: NightPackage }) {
  const stops = (pkg.stops ?? []).filter((s) => s.stop_offer);
  const perPerson = (pkg.subtotal_cents ?? 0) / 100;
  const planHref = `/packages/${pkg.id}/plan`;
  const mood =
    pkg.vibe_tags.slice(0, 2).join(" · ") ||
    pkg.subtitle.trim() ||
    "Curated going-out vibe";
  const tagline =
    pkg.tagline.trim() ||
    pkg.subtitle.trim() ||
    "One unforgettable plan — customize, then book.";

  return (
    <div className="space-y-5">
      <VibeFlowSteps step={0} />

      <div>
        <h2 className="text-xl font-bold tracking-tight">{pkg.title}</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          <span className="font-semibold text-accent">✨ {mood}</span>
          {tagline ? ` · ${tagline}` : ""}
        </p>
      </div>

      {pkg.image_url ? (
        <div className="relative h-28 overflow-hidden rounded-2xl border border-wtva-dark-300 sm:h-32">
          <Image
            src={pkg.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
            priority
            unoptimized
          />
        </div>
      ) : null}

      {stops.length > 0 && (
        <VibePreviewStops
          stops={stops.map((s) => ({
            id: s.id,
            scheduled_label: s.scheduled_label,
            stop_offer: {
              title: s.stop_offer!.title,
              slot_type: s.stop_offer!.slot_type,
              arrival_window: s.stop_offer!.arrival_window,
              venue: s.stop_offer!.venue,
            },
          }))}
        />
      )}

      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5">
        {stops.length > 0 ? (
          <>
            <p className="text-2xl font-bold tabular-nums">
              {formatPrice(perPerson)}
              <span className="ml-1 text-sm font-normal text-wtva-muted">/ person</span>
            </p>
            <p className="mt-1 text-sm text-wtva-muted">
              {stops.length} experiences · one checkout
            </p>
          </>
        ) : (
          <p className="text-sm text-wtva-muted">
            Mix experiences from the live pool, then checkout once.
          </p>
        )}
        <Link href={planHref} className={buttonClass("primary", "lg", "mt-4 w-full")}>
          {stops.length > 0 ? vibeCopy.makeItMine : vibeCopy.buildYourOwn}{" "}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

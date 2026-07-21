import Link from "next/link";
import {
  Flame,
  GlassWater,
  Building2,
  Disc3,
  Music2,
  Sparkles,
  Moon,
  Coffee,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { buildBrowseUrl } from "@/lib/filter-url";

const CATEGORIES = [
  { label: "Trending", href: "/discover/events?featured=1", icon: Flame },
  { label: "Happy Hour", href: buildBrowseUrl("/discover/search", { q: "Happy Hour" }), icon: GlassWater },
  { label: "Rooftops", href: buildBrowseUrl("/discover/search", { q: "Rooftop" }), icon: Building2 },
  { label: "Afrobeats", href: buildBrowseUrl("/discover/search", { q: "Afrobeats" }), icon: Disc3 },
  { label: "Live Music", href: buildBrowseUrl("/discover/search", { q: "Live Music" }), icon: Music2 },
  { label: "VIP & Tables", href: buildBrowseUrl("/discover/search", { q: "VIP" }), icon: Sparkles },
  { label: "After Hours", href: buildBrowseUrl("/discover/search", { q: "After Hours" }), icon: Moon },
  { label: "Brunch", href: buildBrowseUrl("/discover/search", { q: "Brunch" }), icon: Coffee },
] as const;

export function HomeTonightCategories() {
  return (
    <section>
      <SectionHeading
        title="What's happening tonight?"
        href="/discover"
        linkLabel="View all"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {CATEGORIES.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-wtva-dark-300 bg-wtva-card px-3 py-5 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-gradient text-white shadow-accent">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-semibold leading-tight group-hover:text-accent">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonClass } from "@/lib/button";

export function HomeConciergeBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-accent-gradient p-8 text-white shadow-accent md:p-10">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_1fr_auto]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            New
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
            Vibes Concierge
          </h2>
          <p className="mt-2 max-w-md text-white/85">
            Tell us the vibe you want — music, neighborhood, budget — and we&apos;ll
            match you with real events and venues happening tonight.
          </p>
        </div>

        <div className="rounded-2xl border border-white/25 bg-white/15 p-5 shadow-card backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Try asking
          </p>
          <p className="mt-2 text-base font-medium leading-snug">
            &ldquo;I want rooftop drinks with R&amp;B music under $50 tonight&rdquo;
          </p>
        </div>

        <div className="flex lg:justify-end">
          <Link
            href="/discover/concierge"
            className={buttonClass("secondary", "lg", "bg-white text-accent hover:bg-white/90 border-transparent")}
          >
            Ask Concierge →
          </Link>
        </div>
      </div>
    </section>
  );
}

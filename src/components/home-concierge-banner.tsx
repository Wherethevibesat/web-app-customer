import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";
import { buttonClass } from "@/lib/button";

export function HomeConciergeBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/15 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 p-8 shadow-card md:p-10">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-fuchsia-200/40 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_auto_1.1fr]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI Concierge
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
            Not sure where to start?
          </h2>
          <p className="mt-2 max-w-md text-wtva-muted">
            Tell us the vibe — music, neighborhood, budget — and we&apos;ll match
            you with a night that fits.
          </p>
          <Link href="/discover/concierge" className={buttonClass("primary", "lg", "mt-6")}>
            Ask Concierge →
          </Link>
        </div>

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-gradient text-white shadow-accent">
          <Bot className="h-9 w-9" aria-hidden />
        </div>

        <div className="space-y-3">
          <div className="ml-auto max-w-xs rounded-2xl rounded-br-md border border-wtva-dark-300 bg-white px-4 py-3 text-sm shadow-card">
            I&apos;m in town this weekend — plan something fun for my crew.
          </div>
          <div className="max-w-xs rounded-2xl rounded-bl-md bg-accent-gradient px-4 py-3 text-sm font-medium text-white shadow-accent">
            Perfect — I&apos;ve put together a weekend flow for you. Want to
            customize it?
          </div>
        </div>
      </div>
    </section>
  );
}

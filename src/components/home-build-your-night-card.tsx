import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { buttonClass } from "@/lib/button";
import { vibeCopy } from "@/lib/vibe-copy";

const STEPS = [
  { icon: Sparkles, label: "Choose a curated vibe or start from scratch." },
  { icon: PartyPopper, label: "Add experiences (places, events, tables)." },
  { icon: ClipboardList, label: "Review your plan & total." },
  { icon: CreditCard, label: "Checkout — one payment." },
  { icon: CheckCircle2, label: "Show up & enjoy." },
] as const;

/** Floating hero card — Build My Vibe how-it-works + CTA. */
export function HomeBuildYourNightCard() {
  return (
    <aside className="w-full rounded-3xl border border-wtva-dark-300 bg-white p-5 shadow-card md:p-6 lg:max-w-sm lg:shrink-0">
      <h2 className="text-lg font-bold tracking-tight md:text-xl">Build My Vibe</h2>

      <ol className="mt-5 space-y-3.5">
        {STEPS.map(({ icon: Icon, label }, i) => (
          <li key={label} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <p className="pt-1 text-sm leading-snug text-foreground">
              <span className="sr-only">Step {i + 1}. </span>
              {label}
            </p>
          </li>
        ))}
      </ol>

      <Link href="/packages" className={buttonClass("primary", "lg", "mt-6 w-full")}>
        {vibeCopy.buildMyVibe} <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}

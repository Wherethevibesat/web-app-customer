"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/lib/button";
import type { PackageCard } from "@/lib/data/night-packages-shared";
import { slotTypeLabel } from "@/lib/data/night-packages-shared";
import { DIY_VIBE_SLUG } from "@/lib/data/night-packages-shared";
import { formatPrice } from "@/lib/format";
import { vibeCopy } from "@/lib/vibe-copy";

export type PlanSummary = {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
  confirmationCode: string;
  partySize: number;
  startsOn: string | null;
  totalCents: number;
  expiresAt: string | null;
  packagePath: string | null;
};

export function PackagesHub({
  packages,
  plans = [],
  initialTab = "vibes",
  vibeFilter,
  vibeFilterLabel,
  unfilteredCount,
  signedIn = false,
}: {
  packages: PackageCard[];
  plans?: PlanSummary[];
  initialTab?: "vibes" | "plans";
  vibeFilter?: string | null;
  vibeFilterLabel?: string | null;
  unfilteredCount?: number;
  signedIn?: boolean;
}) {
  const [tab, setTab] = useState<"vibes" | "plans">(initialTab);

  return (
    <div>
      {!vibeFilter && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/packages/${DIY_VIBE_SLUG}/plan?mode=random`}
            className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <p className="text-lg font-bold tracking-tight">{vibeCopy.surpriseMe}</p>
            <p className="mt-1 text-sm text-wtva-muted">
              Shuffle a full night from the live DIY pool — swap anything before you pay.
            </p>
            <p className="mt-3 text-sm font-semibold text-accent">
              Shuffle vibe <ArrowRight className="inline h-4 w-4" />
            </p>
          </Link>
          <Link
            href={`/packages/${DIY_VIBE_SLUG}/plan`}
            className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <p className="text-lg font-bold tracking-tight">{vibeCopy.buildYourOwn}</p>
            <p className="mt-1 text-sm text-wtva-muted">{vibeCopy.diyEntryHint}</p>
            <p className="mt-3 text-sm font-semibold text-accent">
              Start empty <ArrowRight className="inline h-4 w-4" />
            </p>
          </Link>
        </div>
      )}
      {vibeFilterLabel && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-accent/10 px-3 py-1 font-semibold text-accent">
            {vibeFilterLabel}
          </span>
          <Link
            href="/packages"
            className="font-semibold text-wtva-muted hover:text-foreground"
          >
            Clear filter
            {unfilteredCount != null ? ` · see all ${unfilteredCount}` : ""}
          </Link>
        </div>
      )}
      <div className="mb-6 inline-flex gap-1 rounded-full border border-wtva-dark-300 bg-wtva-card p-1">
        <button
          type="button"
          onClick={() => setTab("vibes")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "vibes"
              ? "bg-accent-gradient text-white shadow-accent"
              : "text-wtva-muted hover:text-foreground"
          }`}
        >
          {vibeCopy.vibesTab}
        </button>
        <button
          type="button"
          onClick={() => setTab("plans")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "plans"
              ? "bg-accent-gradient text-white shadow-accent"
              : "text-wtva-muted hover:text-foreground"
          }`}
        >
          {vibeCopy.myPlans}
          {plans.length > 0 ? ` (${plans.length})` : ""}
        </button>
      </div>

      {tab === "plans" ? (
        <div className="space-y-4">
          {!signedIn ? (
            <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6">
              <p className="font-semibold">{vibeCopy.myPlans}</p>
              <p className="mt-1 text-sm text-wtva-muted">
                Sign in to see open requests and booked vibes.
              </p>
              <Link
                href={`/auth/login?next=${encodeURIComponent("/packages?tab=plans")}`}
                className="mt-4 inline-block text-sm font-semibold text-accent hover:opacity-80"
              >
                Sign in →
              </Link>
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6">
              <p className="font-semibold">No plans yet</p>
              <p className="mt-1 text-sm text-wtva-muted">
                Request-to-book and paid vibes show up here — including while venues are still
                confirming.
              </p>
              <Link
                href="/packages/orders"
                className="mt-4 inline-block text-sm font-semibold text-accent hover:opacity-80"
              >
                Open full {vibeCopy.myPlans.toLowerCase()} →
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {plans.map((plan) => {
                  const payHref =
                    plan.status === "awaiting_payment" && plan.packagePath
                      ? `/packages/${plan.packagePath}/checkout?orderId=${plan.id}`
                      : null;
                  return (
                    <li
                      key={plan.id}
                      className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-accent">
                        {plan.statusLabel}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">{plan.title}</h3>
                      <p className="mt-1 text-sm text-wtva-muted">
                        Ref {plan.confirmationCode}
                        {plan.startsOn ? ` · ${plan.startsOn}` : ""}
                        {` · ${plan.partySize} guests · ${formatPrice(plan.totalCents / 100)}`}
                        {plan.status === "requested" && plan.expiresAt
                          ? ` · expires ${new Date(plan.expiresAt).toLocaleString()}`
                          : ""}
                      </p>
                      {plan.status === "requested" && (
                        <p className="mt-2 text-sm text-wtva-muted">
                          Waiting for every venue to confirm — then you can pay.
                        </p>
                      )}
                      {payHref && (
                        <Link
                          href={payHref}
                          className={buttonClass("primary", "md", "mt-3")}
                        >
                          Pay now →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/packages/orders"
                className="inline-block text-sm font-semibold text-accent hover:opacity-80"
              >
                Open full {vibeCopy.myPlans.toLowerCase()} →
              </Link>
            </>
          )}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6">
          <p className="text-wtva-muted">
            {vibeFilter
              ? `No curated vibes for ${vibeFilterLabel ?? "this occasion"} yet. Check back as venues add experiences.`
              : vibeCopy.emptyBrowse}
          </p>
          {vibeFilter && (
            <Link
              href="/packages"
              className="mt-4 inline-block text-sm font-semibold text-accent"
            >
              Browse all vibes →
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {packages
            .filter((pkg) => pkg.slug !== DIY_VIBE_SLUG)
            .map((pkg) => {
            const tags =
              pkg.vibe_tags.length > 0
                ? pkg.vibe_tags
                : pkg.stopChain
                    .split(" → ")
                    .filter(Boolean)
                    .map((s) => slotTypeLabel(s.toLowerCase().replace(/ /g, "_")));
            return (
              <li key={pkg.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-wtva-dark-300 bg-wtva-card shadow-card">
                  <div className="relative aspect-[16/10] bg-wtva-dark-200">
                    {pkg.image_url ? (
                      <Image
                        src={pkg.image_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-accent-gradient opacity-85" />
                    )}
                    {pkg.is_featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-accent-gradient px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-accent">
                        {vibeCopy.featuredBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4 md:p-5">
                    <h2 className="text-lg font-bold tracking-tight">{pkg.title}</h2>
                    {pkg.tagline && (
                      <p className="mt-1.5 text-sm leading-relaxed text-wtva-muted line-clamp-2">
                        {pkg.tagline}
                      </p>
                    )}
                    {tags.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {tags.slice(0, 4).map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/packages/${pkg.slug || pkg.id}`}
                      className={buttonClass("primary", "md", "mt-auto pt-4 w-full")}
                    >
                      {vibeCopy.viewVibe} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

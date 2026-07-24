"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { PackageCard } from "@/lib/data/night-packages-shared";

export function PackagesHub({
  packages,
  hasOrders,
}: {
  packages: PackageCard[];
  hasOrders: boolean;
}) {
  const [tab, setTab] = useState<"templates" | "plans">("templates");

  return (
    <div>
      <div className="mb-6 inline-flex gap-1 rounded-full border border-wtva-dark-300 bg-wtva-card p-1">
        <button
          type="button"
          onClick={() => setTab("templates")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "templates"
              ? "bg-accent-gradient text-white shadow-accent"
              : "text-wtva-muted hover:text-foreground"
          }`}
        >
          Templates
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
          My Plans
        </button>
      </div>

      {tab === "plans" ? (
        <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6">
          <p className="font-semibold">Your booked nights</p>
          <p className="mt-1 text-sm text-wtva-muted">
            Confirmation codes and per-stop redemption live here after checkout.
          </p>
          <Link
            href="/packages/orders"
            className="mt-4 inline-block text-sm font-semibold text-accent hover:opacity-80"
          >
            Open my nights →
          </Link>
        </div>
      ) : packages.length === 0 ? (
        <p className="text-wtva-muted">
          No night packages are published yet. Check back soon, or ask Concierge for a custom plan.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => (
            <li key={pkg.id}>
              <Link
                href={`/packages/${pkg.slug || pkg.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-card shadow-card transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover"
              >
                <div className="relative aspect-[16/9] bg-wtva-dark-200">
                  {pkg.image_url ? (
                    <Image
                      src={pkg.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-accent-gradient opacity-80" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {pkg.is_featured && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                      Featured
                    </span>
                  )}
                  <h2 className="mt-1 text-lg font-bold group-hover:text-accent">{pkg.title}</h2>
                  {pkg.subtitle && (
                    <p className="mt-1 text-sm text-wtva-muted line-clamp-2">{pkg.subtitle}</p>
                  )}
                  {pkg.stopChain && (
                    <p className="mt-3 text-xs text-wtva-muted line-clamp-2">{pkg.stopChain}</p>
                  )}
                  <p className="mt-auto pt-4 text-base font-bold">
                    From {formatPrice(pkg.subtotal_cents / 100)}
                    <span className="ml-1 text-sm font-normal text-wtva-muted">/ person</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Building2, Car, Megaphone } from "lucide-react";

const ACCOUNTS = [
  {
    label: "Venue / business",
    description: "List your venue, publish events, manage bookings",
    icon: Building2,
    registerPath: "/auth/register",
    loginPath: "/auth/login",
  },
  {
    label: "Promoter",
    description: "Sell tables and VIP sections at partner venues",
    icon: Megaphone,
    registerPath: "/auth/register?role=promoter",
    loginPath: "/auth/login?role=promoter",
  },
  {
    label: "Driver",
    description: "Offer limo and VIP transport for event nights",
    icon: Car,
    registerPath: "/auth/register?role=driver",
    loginPath: "/auth/login?role=driver",
  },
] as const;

function businessPortalBase() {
  return (process.env.NEXT_PUBLIC_BUSINESS_APP_URL ?? "http://localhost:3002").replace(
    /\/$/,
    "",
  );
}

export function BusinessAccountLinks() {
  const base = businessPortalBase();

  return (
    <div className="mt-8 rounded-xl border border-wtva-dark-300 bg-wtva-dark-400/30 p-4">
      <p className="text-sm font-semibold">Not a customer account?</p>
      <p className="mt-1 text-xs leading-relaxed text-wtva-muted">
        Venues, promoters, and drivers sign up on the{" "}
        <Link href="/for-business" className="underline text-foreground">
          business portal
        </Link>
        . Using the form above creates a <strong className="font-medium text-foreground">customer</strong>{" "}
        account only.
      </p>
      <ul className="mt-4 space-y-2">
        {ACCOUNTS.map(({ label, description, icon: Icon, registerPath }) => (
          <li key={label}>
            <a
              href={`${base}${registerPath}`}
              className="flex items-start gap-3 rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2.5 transition-colors hover:border-wtva-muted"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-wtva-muted" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-wtva-muted">{description}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-xs text-wtva-muted">
        Already have a business account?{" "}
        <a href={`${base}/auth/login`} className="font-medium text-foreground underline">
          Sign in on business portal
        </a>
      </p>
    </div>
  );
}

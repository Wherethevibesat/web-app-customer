import Link from "next/link";
import { headers } from "next/headers";
import { Building2, Car, Megaphone } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getBusinessPortalUrl } from "@/lib/business-portal-url";

const BUSINESS_TYPES = [
  {
    id: "venues",
    title: "Venues",
    description:
      "Bars, clubs, and lounges — list your venue, publish events, sell tickets, and reach customers on WTVA.",
    icon: Building2,
    available: true,
  },
  {
    id: "promoters",
    title: "Promoters",
    description:
      "Promote events, manage guest lists, and partner with venues. Promoter tools are on the way.",
    icon: Megaphone,
    available: false,
  },
  {
    id: "drivers",
    title: "Drivers",
    description:
      "Partner as a driver for event nights and VIP runs. Driver onboarding opens soon.",
    icon: Car,
    available: false,
  },
] as const;

export default async function ForBusinessPage() {
  const host = (await headers()).get("host");
  const loginUrl = getBusinessPortalUrl("/auth/login", host);
  const registerUrl = getBusinessPortalUrl("/auth/register", host);

  return (
    <PageShell
      title="For Business"
      subtitle="Tools for venues, promoters, and partners who power the nightlife scene."
      width="wide"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {BUSINESS_TYPES.map(({ id, title, description, icon: Icon, available }) => (
          <article
            key={id}
            className="flex flex-col rounded-xl border border-wtva-dark-300 bg-wtva-card p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-wtva-dark-300">
                <Icon className="h-5 w-5 text-foreground" aria-hidden />
              </div>
              {!available && (
                <span className="rounded-full bg-wtva-dark-300 px-2.5 py-0.5 text-xs font-semibold text-wtva-muted">
                  Coming soon
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-wtva-muted">{description}</p>
            {available ? (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <a
                  href={loginUrl}
                  className="inline-flex justify-center rounded-lg border border-wtva-dark-300 px-4 py-2.5 text-sm font-semibold hover:border-foreground"
                >
                  Sign in
                </a>
                <a
                  href={registerUrl}
                  className="inline-flex justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
                >
                  Create account
                </a>
              </div>
            ) : (
              <p className="mt-6 text-sm text-wtva-subtle">We&apos;ll notify you when this opens.</p>
            )}
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-dashed border-wtva-dark-300 p-6 text-center">
        <p className="text-sm text-wtva-muted">
          Already have a venue account?{" "}
          <a href={loginUrl} className="font-medium text-foreground underline">
            Go to the business portal
          </a>
        </p>
        <p className="mt-3 text-xs text-wtva-subtle">
          Looking for tonight&apos;s events?{" "}
          <Link href="/discover" className="underline hover:text-foreground">
            Back to Discover
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

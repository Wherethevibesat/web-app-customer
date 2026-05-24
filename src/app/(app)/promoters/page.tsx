import { headers } from "next/headers";
import { Megaphone } from "lucide-react";
import { PromoterBrowseCard } from "@/components/promoter-browse-card";
import { listPromotersForBrowse } from "@/lib/data/promoters";
import { getBusinessPortalUrl } from "@/lib/business-portal-url";

export default async function PromotersBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const host = (await headers()).get("host");
  const promoters = await listPromotersForBrowse(q).catch(() => []);

  const loginUrl = getBusinessPortalUrl("/auth/login?role=promoter", host);
  const registerUrl = getBusinessPortalUrl("/auth/register?role=promoter", host);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Promoters</h1>
      <p className="mt-2 max-w-2xl text-wtva-muted">
        Browse nightlife promoters selling tables and VIP sections at partner venues. Request to
        book on event pages or view their current offers.
      </p>

      <section className="mt-8 rounded-xl border border-wtva-dark-300 bg-wtva-card p-6 md:flex md:items-center md:justify-between md:gap-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-wtva-dark-300">
            <Megaphone className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Are you a promoter?</h2>
            <p className="mt-1 max-w-xl text-sm text-wtva-muted">
              Partner with venues, create VIP offers, and manage customer inquiries from the WTVA
              business portal.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
          <a
            href={loginUrl}
            className="inline-flex justify-center rounded-lg border border-wtva-dark-300 px-4 py-2.5 text-sm font-semibold hover:border-foreground"
          >
            Promoter sign in
          </a>
          <a
            href={registerUrl}
            className="inline-flex justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
          >
            Become a promoter
          </a>
        </div>
      </section>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search promoter or venue…"
          className="flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background"
        >
          Search
        </button>
      </form>

      {promoters.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-wtva-dark-300 py-16 text-center text-wtva-muted">
          No promoters listed yet. Check back soon or{" "}
          <a href={registerUrl} className="underline">
            apply to become a promoter
          </a>
          .
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {promoters.map((promoter) => (
            <PromoterBrowseCard key={promoter.user_id} promoter={promoter} />
          ))}
        </div>
      )}
    </div>
  );
}

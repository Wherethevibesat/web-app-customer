import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { NightPackageItinerary } from "@/components/night-package-itinerary";
import { VibeSplitInProgressList } from "@/components/vibe-split-in-progress";
import { createClient } from "@/lib/supabase/server";
import { listOpenVibeSplits } from "@/lib/data/vibe-open-splits";
import { expireOverdueVibeRequests } from "@/lib/data/vibe-request-book";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/lib/button";
import { vibeCopy } from "@/lib/vibe-copy";

function statusLabel(status: string) {
  switch (status) {
    case "requested":
      return "Waiting on venues";
    case "awaiting_payment":
      return "Ready to pay";
    case "expired":
      return "Request expired";
    case "cancelled":
      return "Cancelled";
    case "paid":
      return "Booked";
    default:
      return status;
  }
}

export default async function NightPackageOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/packages/orders");

  await expireOverdueVibeRequests().catch(() => 0);

  const [{ data: orders }, openSplits] = await Promise.all([
    supabase
      .from("night_package_orders")
      .select(
        `
      id, confirmation_code, party_size, starts_on, total_cents, status, paid_at, created_at, expires_at,
      package:night_packages(id, title, slug),
      stops:night_package_order_stops(
        id, title, venue_id, scheduled_label, redemption_code, status, sort_order,
        line_total_cents, stop_offer_id,
        venue:venues(name)
      )
    `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    listOpenVibeSplits(supabase, user.id),
  ]);

  const rows = orders ?? [];
  const empty = rows.length === 0 && openSplits.length === 0;

  return (
    <PageShell
      title={vibeCopy.myPlans}
      subtitle="Open requests, payments, itineraries, and per-stop codes."
    >
      {openSplits.length > 0 && (
        <section className="mb-8 space-y-3">
          <h2 className="text-base font-bold">Finish payment</h2>
          <VibeSplitInProgressList splits={openSplits} />
        </section>
      )}

      {empty ? (
        <p className="text-wtva-muted">
          No plans yet.{" "}
          <Link href="/packages" className="underline text-foreground">
            Browse curated vibes
          </Link>
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-wtva-muted">
          Booked vibes will show here once everyone pays.
        </p>
      ) : (
        <section className="space-y-6">
          {openSplits.length > 0 && (
            <h2 className="text-base font-bold">Your vibes</h2>
          )}
          <ul className="space-y-6">
            {rows.map((order) => {
              const pkg = order.package as
                | { id: string; title: string; slug: string | null }
                | { id: string; title: string; slug: string | null }[]
                | null;
              const pkgRow = Array.isArray(pkg) ? pkg[0] : pkg;
              const isPaid = order.status === "paid";
              const stops = (
                (order.stops as {
                  id: string;
                  title: string;
                  scheduled_label: string | null;
                  redemption_code: string;
                  status: string;
                  sort_order: number;
                  line_total_cents: number | null;
                  stop_offer_id: string;
                  venue: { name: string } | { name: string }[] | null;
                }[]) ?? []
              ).map((s) => {
                const venue = Array.isArray(s.venue) ? s.venue[0] : s.venue;
                return {
                  id: s.id,
                  title: s.title,
                  scheduled_label: s.scheduled_label,
                  redemption_code: isPaid ? s.redemption_code : "—",
                  status: s.status,
                  sort_order: s.sort_order,
                  line_total_cents: s.line_total_cents,
                  venue_name: venue?.name ?? null,
                  stop_offer_id: s.stop_offer_id,
                };
              });

              const payHref =
                order.status === "awaiting_payment" && pkgRow
                  ? `/packages/${pkgRow.slug || pkgRow.id}/checkout?orderId=${order.id}`
                  : null;

              return (
                <li
                  key={order.id}
                  className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5"
                >
                  {isPaid ? (
                    <NightPackageItinerary
                      confirmationCode={order.confirmation_code}
                      packageTitle={pkgRow?.title ?? "Your vibe"}
                      partySize={order.party_size}
                      totalCents={order.total_cents}
                      startsOn={order.starts_on as string | null}
                      stops={stops}
                    />
                  ) : (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-accent">
                        {statusLabel(order.status)}
                      </p>
                      <h2 className="mt-1 text-lg font-bold">
                        {pkgRow?.title ?? "Your vibe"}
                      </h2>
                      <p className="mt-1 text-sm text-wtva-muted">
                        Ref {order.confirmation_code}
                        {order.starts_on ? ` · ${order.starts_on}` : ""}
                        {` · ${order.party_size} guests`}
                        {order.status === "requested" && order.expires_at
                          ? ` · expires ${new Date(order.expires_at).toLocaleString()}`
                          : ""}
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-wtva-muted">
                        {stops
                          .slice()
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((s) => (
                            <li key={s.id}>
                              {s.title}
                              {s.venue_name ? ` · ${s.venue_name}` : ""}
                              {" · "}
                              <span className="capitalize">
                                {s.status.replace(/_/g, " ")}
                              </span>
                            </li>
                          ))}
                      </ul>
                      {payHref && (
                        <Link
                          href={payHref}
                          className={buttonClass("primary", "md", "mt-4")}
                        >
                          Pay now →
                        </Link>
                      )}
                      {order.status === "requested" && (
                        <p className="mt-3 text-sm text-wtva-muted">
                          Venues are reviewing your request. You&apos;ll be notified when
                          everyone confirms.
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-3 text-right text-xs text-wtva-muted capitalize">
                    {statusLabel(order.status)}
                    {order.paid_at
                      ? ` · paid ${new Date(order.paid_at).toLocaleDateString()}`
                      : ""}
                    {" · "}
                    {formatPrice(order.total_cents / 100)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <Link
        href="/packages"
        className="mt-8 inline-block text-sm text-wtva-muted underline hover:text-foreground"
      >
        ← Browse curated vibes
      </Link>
    </PageShell>
  );
}

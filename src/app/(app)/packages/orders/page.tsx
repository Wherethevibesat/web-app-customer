import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { NightPackageItinerary } from "@/components/night-package-itinerary";
import { VibeSplitInProgressList } from "@/components/vibe-split-in-progress";
import { createClient } from "@/lib/supabase/server";
import { listOpenVibeSplits } from "@/lib/data/vibe-open-splits";
import { formatPrice } from "@/lib/format";
import { vibeCopy } from "@/lib/vibe-copy";

export default async function NightPackageOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/packages/orders");

  const [{ data: orders }, openSplits] = await Promise.all([
    supabase
      .from("night_package_orders")
      .select(
        `
      id, confirmation_code, party_size, starts_on, total_cents, status, paid_at, created_at,
      package:night_packages(id, title, slug),
      stops:night_package_order_stops(
        id, title, venue_id, scheduled_label, redemption_code, status, sort_order,
        line_total_cents,
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
      subtitle="Finish open splits, then find itineraries and per-stop codes."
      width="narrow"
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
            <h2 className="text-base font-bold">Booked</h2>
          )}
          <ul className="space-y-6">
          {rows.map((order) => {
            const pkg = order.package as
              | { id: string; title: string; slug: string | null }
              | { id: string; title: string; slug: string | null }[]
              | null;
            const pkgRow = Array.isArray(pkg) ? pkg[0] : pkg;
            const stops = (
              (order.stops as {
                id: string;
                title: string;
                scheduled_label: string | null;
                redemption_code: string;
                status: string;
                sort_order: number;
                line_total_cents: number | null;
                venue: { name: string } | { name: string }[] | null;
              }[]) ?? []
            ).map((s) => {
              const venue = Array.isArray(s.venue) ? s.venue[0] : s.venue;
              return {
                id: s.id,
                title: s.title,
                scheduled_label: s.scheduled_label,
                redemption_code: s.redemption_code,
                status: s.status,
                sort_order: s.sort_order,
                line_total_cents: s.line_total_cents,
                venue_name: venue?.name ?? null,
              };
            });

            return (
              <li key={order.id}>
                <NightPackageItinerary
                  confirmationCode={order.confirmation_code}
                  packageTitle={pkgRow?.title ?? "Your vibe"}
                  partySize={order.party_size}
                  totalCents={order.total_cents}
                  startsOn={order.starts_on as string | null}
                  stops={stops}
                />
                <p className="mt-2 text-right text-xs text-wtva-muted capitalize">
                  {order.status}
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

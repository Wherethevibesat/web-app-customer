import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { NightPackageItinerary } from "@/components/night-package-itinerary";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export default async function NightPackageOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/packages/orders");

  const { data: orders } = await supabase
    .from("night_package_orders")
    .select(
      `
      id, confirmation_code, party_size, total_cents, status, paid_at, created_at,
      package:night_packages(id, title, slug),
      stops:night_package_order_stops(
        id, title, venue_id, scheduled_label, redemption_code, status, sort_order,
        line_total_cents,
        venue:venues(name)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = orders ?? [];

  return (
    <PageShell
      title="Your nights"
      subtitle="Itinerary, confirmation, and per-stop codes."
      width="narrow"
    >
      {rows.length === 0 ? (
        <p className="text-wtva-muted">
          No packages yet.{" "}
          <Link href="/packages" className="underline text-foreground">
            Browse Build Your Night
          </Link>
        </p>
      ) : (
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
                  packageTitle={pkgRow?.title ?? "Night package"}
                  partySize={order.party_size}
                  totalCents={order.total_cents}
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
      )}
      <Link
        href="/packages"
        className="mt-8 inline-block text-sm text-wtva-muted underline hover:text-foreground"
      >
        ← Browse packages
      </Link>
    </PageShell>
  );
}

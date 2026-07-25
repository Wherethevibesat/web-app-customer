import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Home,
  MapPin,
  MessageSquare,
  MoonStar,
  QrCode,
  Sparkles,
  UserRound,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { AccountNav } from "@/components/account-nav";
import { NightPackageItinerary } from "@/components/night-package-itinerary";
import { VibeSplitInProgressList } from "@/components/vibe-split-in-progress";
import { buttonClass } from "@/lib/button";
import { createClient } from "@/lib/supabase/server";
import { listFavorites } from "@/lib/data/favorites";
import { listOpenVibeSplits } from "@/lib/data/vibe-open-splits";
import { formatPrice } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const [
    { data: profile },
    favorites,
    { data: orders },
    { data: recentCheckIns },
    openSplits,
  ] = await Promise.all([
      supabase.from("users").select("name, email").eq("id", user.id).maybeSingle(),
      listFavorites(user.id).catch(() => []),
      supabase
        .from("night_package_orders")
        .select(
          `
          id, confirmation_code, party_size, starts_on, total_cents, status, paid_at,
          package:night_packages(id, title, slug),
          stops:night_package_order_stops(
            id, title, scheduled_label, redemption_code, status, sort_order,
            line_total_cents, venue:venues(name)
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("check_ins")
        .select("id, checked_in_at, venue:venues(id, name)")
        .eq("user_id", user.id)
        .order("checked_in_at", { ascending: false })
        .limit(3),
      listOpenVibeSplits(supabase, user.id),
    ]);

  const firstName =
    (profile?.name ?? user.user_metadata?.name ?? "there").toString().split(" ")[0] ||
    "there";

  const latestOrder = orders?.[0] ?? null;
  const quickActions = [
    {
      href: "/discover",
      label: "Discover",
      desc: "Main homepage — what’s on tonight",
      icon: Home,
    },
    {
      href: "/packages",
      label: "Build My Vibe",
      desc: "Browse curated vibes & customize",
      icon: MoonStar,
    },
    {
      href: "/check-in",
      label: "Check in",
      desc: "Scan or confirm you’re here",
      icon: QrCode,
    },
    {
      href: "/discover/concierge",
      label: "Ask Concierge",
      desc: "Get a custom nightlife plan",
      icon: Sparkles,
    },
    {
      href: "/discover/events",
      label: "Browse events",
      desc: "See what’s on tonight",
      icon: CalendarDays,
    },
    {
      href: "/messages",
      label: "Messages",
      desc: "Inbox & venue chats",
      icon: MessageSquare,
    },
    {
      href: "/profile",
      label: "Account",
      desc: "Profile, favorites, settings",
      icon: UserRound,
    },
  ] as const;

  return (
    <PageShell
      title={`Hey, ${firstName}`}
      subtitle="Your nightlife hub — plans, check-ins, and what’s next."
      width="wide"
    >
      <AccountNav />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient text-white shadow-accent">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-bold">{label}</p>
            <p className="mt-1 text-sm text-wtva-muted">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold">My Plans</h2>
            <Link href="/packages/orders" className="text-sm font-semibold text-accent">
              View all →
            </Link>
          </div>
          {openSplits.length > 0 && (
            <VibeSplitInProgressList splits={openSplits.slice(0, 2)} compact />
          )}
          {latestOrder ? (
            (() => {
              const pkg = latestOrder.package as
                | { title: string }
                | { title: string }[]
                | null;
              const pkgRow = Array.isArray(pkg) ? pkg[0] : pkg;
              const stops = (
                (latestOrder.stops as {
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
                <NightPackageItinerary
                  confirmationCode={latestOrder.confirmation_code}
                  packageTitle={pkgRow?.title ?? "Your vibe"}
                  partySize={latestOrder.party_size}
                  totalCents={latestOrder.total_cents}
                  startsOn={latestOrder.starts_on as string | null}
                  stops={stops}
                />
              );
            })()
          ) : openSplits.length === 0 ? (
            <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6">
              <p className="font-semibold">No plans booked yet</p>
              <p className="mt-1 text-sm text-wtva-muted">
                Pick a curated vibe, customize experiences, and pay once.
              </p>
              <Link href="/packages" className={buttonClass("primary", "md", "mt-4")}>
                Build My Vibe
              </Link>
            </div>
          ) : null}
        </section>

        <aside className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-lg font-bold">Saved venues</h2>
              <Link href="/profile/favorites" className="text-sm font-semibold text-accent">
                All →
              </Link>
            </div>
            {favorites.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {favorites.slice(0, 4).map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/venues/${v.id}`}
                      className="flex items-center gap-3 rounded-xl border border-wtva-dark-300 bg-wtva-card px-3 py-3 text-sm hover:border-accent/40"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-accent" />
                      <span className="font-medium">{v.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-wtva-muted">
                Save venues while browsing to see them here.
              </p>
            )}
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-lg font-bold">Recent check-ins</h2>
              <Link href="/check-in" className="text-sm font-semibold text-accent">
                Check in →
              </Link>
            </div>
            {(recentCheckIns ?? []).length > 0 ? (
              <ul className="mt-3 space-y-2">
                {(recentCheckIns ?? []).map((row) => {
                  const venue = row.venue as
                    | { id: string; name: string }
                    | { id: string; name: string }[]
                    | null;
                  const venueRow = Array.isArray(venue) ? venue[0] : venue;
                  return (
                    <li
                      key={row.id}
                      className="rounded-xl border border-wtva-dark-300 bg-wtva-card px-3 py-3 text-sm"
                    >
                      <p className="font-medium">{venueRow?.name ?? "Venue"}</p>
                      <p className="text-xs text-wtva-muted">
                        {row.checked_in_at
                          ? new Date(row.checked_in_at).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "—"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-wtva-muted">
                Your recent venue check-ins will show up here.
              </p>
            )}
          </section>

          {latestOrder && (
            <p className="text-xs text-wtva-muted">
              Latest booking {formatPrice(latestOrder.total_cents / 100)} ·{" "}
              <Link href="/packages/orders" className="underline">
                itinerary
              </Link>
            </p>
          )}
        </aside>
      </div>
    </PageShell>
  );
}

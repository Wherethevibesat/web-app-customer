import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { CheckInForm } from "@/components/check-in-form";
import { AccountNav } from "@/components/account-nav";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { listVenues } from "@/lib/data/venues";
import { CHECK_IN_POINTS } from "@/lib/ranking-rules";

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string; token?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/check-in");

  const { venue: venueId, token } = await searchParams;
  const all = await listVenues().catch(() => []);
  const venues = all.map((v) => ({ id: v.id, name: v.name }));

  return (
    <PageShell
      title="Check in"
      subtitle={`Earn +${CHECK_IN_POINTS} points every time you check in at a venue`}
      width="wide"
    >
      <AccountNav />
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6 md:p-8">
          <CheckInForm venues={venues} defaultVenueId={venueId} token={token} />
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-6">
            <MapPin className="h-8 w-8 text-wtva-muted" />
            <h2 className="mt-3 font-semibold">How it works</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-wtva-muted">
              <li>Pick the venue you&apos;re at right now</li>
              <li>Add an optional caption</li>
              <li>Submit — points apply instantly to your rank</li>
            </ol>
          </div>
          <Link
            href="/ranking"
            className="block rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 text-sm font-medium hover:border-foreground"
          >
            View leaderboard →
          </Link>
          <Link
            href="/venues"
            className="block rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 text-sm font-medium hover:border-foreground"
          >
            Browse venues →
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}

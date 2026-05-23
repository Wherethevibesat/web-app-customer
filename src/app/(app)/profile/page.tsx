import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { getMyRanking } from "@/lib/data/rankings";
import { listMyCheckIns } from "@/lib/data/check-ins";
import { pointsToNextTier } from "@/lib/ranking-rules";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, created_at")
    .eq("id", user.id)
    .single();

  const ranking = await getMyRanking(user.id).catch(() => null);
  const checkIns = await listMyCheckIns(user.id).catch(() => []);

  return (
    <PageShell title="Your account" subtitle="Manage your profile, favorites, and activity" width="wide">
      <AccountNav />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6 md:p-8">
            <p className="text-sm text-wtva-muted">Member since</p>
            <p className="text-lg font-semibold">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
            <h2 className="mt-6 text-2xl font-bold">{profile?.name ?? "User"}</h2>
            <p className="text-wtva-muted">{profile?.email}</p>
            <Link
              href="/settings"
              className="mt-6 inline-block text-sm font-medium underline"
            >
              Edit profile
            </Link>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Recent check-ins</h3>
            {checkIns.length > 0 ? (
              <ul className="mt-4 divide-y divide-wtva-dark-300 rounded-xl border border-wtva-dark-300 bg-wtva-card">
                {checkIns.slice(0, 10).map((c) => (
                  <li key={c.id} className="flex justify-between px-4 py-3 text-sm">
                    <span>{c.venueName}</span>
                    <span className="text-green-400">+{c.points_awarded} pts</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-wtva-muted">
                No check-ins yet.{" "}
                <Link href="/check-in" className="underline text-foreground">
                  Check in at a venue
                </Link>
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {ranking && (
            <div className="rounded-2xl border border-wtva-dark-300 bg-gradient-to-br from-wtva-dark-300 to-wtva-card p-6">
              <p className="text-sm text-wtva-muted">Your tier</p>
              <p className="mt-1 text-3xl font-bold">{ranking.tier.name}</p>
              <p className="mt-2 text-lg">{ranking.points.toLocaleString()} points</p>
              {pointsToNextTier(ranking.points) > 0 && (
                <p className="mt-2 text-sm text-wtva-muted">
                  {pointsToNextTier(ranking.points).toLocaleString()} pts to next tier
                </p>
              )}
              <Link
                href="/ranking"
                className="mt-4 inline-block text-sm font-semibold underline"
              >
                View leaderboard
              </Link>
            </div>
          )}
          <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 space-y-3 text-sm">
            <Link href="/profile/favorites" className="block hover:underline">
              Saved venues →
            </Link>
            <Link href="/events" className="block hover:underline">
              Browse events →
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-red-400 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

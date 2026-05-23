import Link from "next/link";
import { Trophy } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard, getMyRanking } from "@/lib/data/rankings";
import { pointsToNextTier, RANK_TIERS } from "@/lib/ranking-rules";

export default async function RankingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const leaderboard = await getLeaderboard(25).catch(() => []);

  let myRank = null;
  if (user) {
    myRank = await getMyRanking(user.id).catch(() => null);
  }

  return (
    <PageShell
      title="City rankings"
      subtitle="Climb tiers by checking in at venues across the city"
      width="wide"
    >
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {myRank ? (
            <div className="mb-8 rounded-2xl border border-wtva-dark-300 bg-gradient-to-r from-wtva-dark-300 to-wtva-card p-6 md:flex md:items-center md:justify-between">
              <div>
                <p className="text-sm text-wtva-muted">Your rank</p>
                <p className="text-3xl font-bold">{myRank.tier.name}</p>
                <p className="mt-1">{myRank.points.toLocaleString()} points</p>
              </div>
              {pointsToNextTier(myRank.points) > 0 && (
                <p className="mt-4 md:mt-0 text-sm text-wtva-muted">
                  {pointsToNextTier(myRank.points).toLocaleString()} pts to next tier
                </p>
              )}
            </div>
          ) : (
            <div className="mb-8 rounded-xl border border-wtva-dark-300 bg-wtva-card p-6 text-center">
              <p className="text-wtva-muted">
                <Link href="/auth/login" className="font-semibold text-foreground underline">
                  Sign in
                </Link>{" "}
                to track your rank and check in for points.
              </p>
            </div>
          )}

          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Leaderboard
          </h2>
          <ol className="mt-4 divide-y divide-wtva-dark-300 rounded-xl border border-wtva-dark-300 bg-wtva-card">
            {leaderboard.map((entry, i) => (
              <li
                key={entry.user.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      i < 3 ? "bg-foreground text-background" : "bg-wtva-dark-300"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium">{entry.user.name}</span>
                </span>
                <span className="text-sm text-wtva-muted text-right">
                  {entry.points.toLocaleString()} pts
                  <br />
                  <span className="text-xs">{entry.tier.name}</span>
                </span>
              </li>
            ))}
          </ol>
          {leaderboard.length === 0 && (
            <p className="mt-4 text-center text-wtva-muted py-12">No rankings yet. Be the first to check in!</p>
          )}
        </div>

        <aside>
          <h3 className="font-semibold">Tier guide</h3>
          <ul className="mt-4 space-y-3">
            {RANK_TIERS.map((t) => (
              <li
                key={t.name}
                className="rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
              >
                <p className="font-semibold">{t.name}</p>
                <p className="text-wtva-muted">
                  {t.pointsRequired.toLocaleString()}+ pts
                  {"payRate" in t && t.payRate ? ` · ${t.payRate}` : ""}
                </p>
              </li>
            ))}
          </ul>
          {user && (
            <Link
              href="/check-in"
              className="mt-6 block w-full rounded-lg bg-foreground py-3 text-center text-sm font-semibold text-background"
            >
              Check in now
            </Link>
          )}
        </aside>
      </div>
    </PageShell>
  );
}

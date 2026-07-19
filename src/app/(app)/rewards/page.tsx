import Link from "next/link";
import { Gift, Ticket } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { RewardRedeemButton } from "@/components/reward-redeem-button";
import { createClient } from "@/lib/supabase/server";
import { getMyRanking } from "@/lib/data/rankings";
import { listRewards, listMyRedemptions } from "@/lib/data/rewards";

const TYPE_LABELS: Record<string, string> = {
  perk: "Perk",
  discount: "Discount",
  free_item: "Free item",
  experience: "Experience",
};

export default async function RewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const rewards = await listRewards().catch(() => []);
  const ranking = user ? await getMyRanking(user.id).catch(() => null) : null;
  const redemptions = user ? await listMyRedemptions(user.id).catch(() => []) : [];
  const points = ranking?.points ?? 0;

  return (
    <PageShell
      title="Rewards"
      subtitle="Spend the points you earn checking in on perks at venues across the city"
      width="wide"
    >
      {user ? (
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-wtva-dark-300 bg-gradient-to-r from-wtva-dark-300 to-wtva-card p-5">
          <Gift className="h-8 w-8 text-accent" />
          <div>
            <p className="text-sm text-wtva-muted">Your balance</p>
            <p className="text-2xl font-bold">{points.toLocaleString()} points</p>
          </div>
          <Link
            href="/check-in"
            className="ml-auto rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Earn more →
          </Link>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5 text-center">
          <p className="text-wtva-muted">
            <Link href="/auth/login?next=/rewards" className="font-semibold text-foreground underline">
              Sign in
            </Link>{" "}
            to redeem rewards with your points.
          </p>
        </div>
      )}

      {redemptions.length > 0 && (
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Ticket className="h-5 w-5 text-accent" /> Your codes
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {redemptions.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.rewardTitle}</p>
                  <span
                    className={
                      r.status === "issued"
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400"
                        : "rounded-full bg-wtva-dark-300 px-2 py-0.5 text-xs font-medium text-wtva-muted"
                    }
                  >
                    {r.status === "issued" ? "Active" : r.status}
                  </span>
                </div>
                {r.venueName && <p className="text-xs text-wtva-muted">{r.venueName}</p>}
                <p className="mt-3 font-mono text-lg font-bold tracking-widest">{r.code}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="text-lg font-semibold">Available rewards</h2>
      {rewards.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const outOfStock =
              reward.stock != null && reward.redeemed_count >= reward.stock;
            return (
              <div
                key={reward.id}
                className="flex flex-col rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-wtva-dark-300 px-2.5 py-1 text-xs font-medium text-wtva-muted">
                    {TYPE_LABELS[reward.reward_type] ?? reward.reward_type}
                  </span>
                  <span className="text-sm font-bold text-accent">
                    {reward.cost_points.toLocaleString()} pts
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold">{reward.title}</h3>
                {reward.venueName && (
                  <p className="text-sm text-wtva-muted">{reward.venueName}</p>
                )}
                {reward.description && (
                  <p className="mt-2 flex-1 text-sm text-wtva-muted">{reward.description}</p>
                )}
                <div className="mt-4">
                  <RewardRedeemButton
                    rewardId={reward.id}
                    costPoints={reward.cost_points}
                    affordable={Boolean(user) && points >= reward.cost_points}
                    outOfStock={outOfStock}
                  />
                </div>
                {reward.terms && (
                  <p className="mt-2 text-[11px] text-wtva-muted">{reward.terms}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-wtva-dark-300 bg-wtva-card p-8 text-center text-wtva-muted">
          No rewards available yet. Check back soon!
        </p>
      )}
    </PageShell>
  );
}

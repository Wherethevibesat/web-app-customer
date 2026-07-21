import Link from "next/link";
import { Award, Gift, MapPin, Star, Trophy } from "lucide-react";
import { buttonClass } from "@/lib/button";
import { CHECK_IN_POINTS, RANK_TIERS, pointsToNextTier, tierForPoints } from "@/lib/ranking-rules";

type HomeRewardsSectionProps = {
  points?: number | null;
};

const STEPS = [
  {
    label: "Check in",
    detail: `Earn +${CHECK_IN_POINTS} pts when you show up`,
    icon: MapPin,
  },
  {
    label: "Climb ranks",
    detail: "Rise from Vibee to Influencer",
    icon: Trophy,
  },
  {
    label: "Redeem rewards",
    detail: "Unlock perks, discounts & freebies",
    icon: Gift,
  },
  {
    label: "Be recognized",
    detail: "Stand out on the city leaderboard",
    icon: Award,
  },
] as const;

export function HomeRewardsSection({ points = null }: HomeRewardsSectionProps) {
  const safePoints = points ?? 0;
  const tier = tierForPoints(safePoints);
  const toNext = pointsToNextTier(safePoints);
  const nextTier = RANK_TIERS.find((t) => t.pointsRequired > safePoints);
  const progressMax = nextTier?.pointsRequired ?? tier.pointsRequired;
  const progressMin =
    [...RANK_TIERS].reverse().find((t) => t.pointsRequired <= safePoints)?.pointsRequired ?? 0;
  const progress =
    progressMax > progressMin
      ? Math.min(100, ((safePoints - progressMin) / (progressMax - progressMin)) * 100)
      : 100;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-wtva-dark-300 bg-wtva-card shadow-card">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative grid lg:grid-cols-[1fr_1.35fr]">
        <div className="border-b border-wtva-dark-300 bg-accent-gradient p-8 text-white md:p-10 lg:border-b-0 lg:border-r lg:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">
            Loyalty
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Earn rewards every time you show up
          </h2>
          <p className="mt-3 max-w-sm text-white/85">
            Check in at venues, climb the ranks, and unlock real nightlife perks across Houston.
          </p>

          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Your vibe status
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold">{points == null ? "Vibee" : tier.name}</p>
              <p className="text-sm text-white/80">
                {points == null ? "0 pts" : `${safePoints.toLocaleString()} pts`}
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${points == null ? 8 : progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/75">
              {points == null
                ? "Join free to start earning"
                : nextTier
                  ? `${toNext.toLocaleString()} pts to ${nextTier.name}`
                  : "Top tier unlocked"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={points == null ? "/auth/register" : "/check-in"}
              className={buttonClass(
                "secondary",
                "lg",
                "bg-white text-accent hover:bg-white/90 border-transparent",
              )}
            >
              {points == null ? "Join now" : "Check in"}
            </Link>
            <Link
              href="/rewards"
              className={buttonClass("onDark", "lg", "border-white/40 text-white hover:bg-white/10")}
            >
              View rewards
            </Link>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-wtva-muted">
            How it works
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {STEPS.map(({ label, detail, icon: Icon }, index) => (
              <div
                key={label}
                className="flex gap-3 rounded-2xl border border-wtva-dark-300 bg-background/60 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-gradient text-white shadow-accent">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    <span className="text-accent">{index + 1}.</span> {label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-wtva-muted">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-wtva-muted">
                Rank path
              </p>
              <Link href="/ranking" className="text-xs font-semibold text-accent hover:opacity-80">
                See leaderboard →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {RANK_TIERS.map((t, index) => {
                const unlocked = points != null && safePoints >= t.pointsRequired;
                const current = points != null && tier.name === t.name;
                return (
                  <div
                    key={t.name}
                    className={`flex flex-col items-center rounded-2xl border px-2 py-3.5 text-center transition-colors ${
                      current
                        ? "border-accent bg-accent/5 shadow-card"
                        : unlocked
                          ? "border-accent/30 bg-accent/5"
                          : "border-wtva-dark-300 bg-background/60"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        unlocked || current
                          ? "bg-accent-gradient text-white shadow-accent"
                          : "bg-wtva-dark-400 text-wtva-muted"
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <p className="mt-2 text-[11px] font-semibold leading-tight">{t.name}</p>
                    <p className="mt-0.5 text-[10px] text-wtva-subtle">
                      {index === 0 ? "Start" : `${(t.pointsRequired / 1000).toFixed(0)}k pts`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

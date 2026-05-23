export const CHECK_IN_POINTS = 25;

export const RANK_TIERS = [
  { name: "Vibee", pointsRequired: 500 },
  { name: "Vibe Master", pointsRequired: 10_000, payRate: "$50/hr" },
  { name: "Vibe Champion", pointsRequired: 25_000, payRate: "$100/hr" },
  { name: "Vibesetters", pointsRequired: 50_000, payRate: "$200/hr" },
  { name: "Influencers", pointsRequired: 100_000, payRate: "$500/hr" },
] as const;

export type RankTier = (typeof RANK_TIERS)[number];

export function tierForPoints(points: number): RankTier {
  let current: RankTier = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (points >= t.pointsRequired) current = t;
  }
  return current;
}

export function pointsToNextTier(points: number) {
  for (const t of RANK_TIERS) {
    if (points < t.pointsRequired) return t.pointsRequired - points;
  }
  return 0;
}

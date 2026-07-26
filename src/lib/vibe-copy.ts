/** User-facing Vibe language (DB still uses night_packages). */

export const vibeCopy = {
  curatedTitle: "Curated Vibes",
  curatedSubtitle: "Hand-picked by our concierge. Updated every week.",
  viewVibe: "View Vibe",
  makeItMine: "Continue",
  buildYourVibe: "Build Your Vibe",
  buildMyVibe: "Build My Vibe",
  buildYourOwn: "Build Your Own",
  surpriseMe: "Surprise Me",
  bookMyVibe: "Book My Vibe",
  myPlans: "My Plans",
  vibesTab: "Vibes",
  yourVibe: "Your Vibe",
  changeStop: "Change",
  continue: "Continue",
  bookedTitle: "Your vibe is booked",
  emptyBrowse: "No curated vibes are published yet. Check back soon.",
  featuredBadge: "Trending",
  pickYourVibeTitle: "Pick your vibe",
  pickYourVibeSubtitle:
    "Start from an occasion, shuffle a random vibe, or build your own.",
  seeAllVibes: "See all vibes",
  diyEntryHint: "Mix venues yourself — or let us shuffle a full night from the live pool.",
  shuffleAgain: "Shuffle again",
  /** @deprecated use buildYourVibe */
  customizeYourVibe: "Build Your Vibe",
  /** @deprecated review removed from flow */
  reviewYourVibe: "Your Vibe",
  replaceStop: "Change",
  continueToReview: "Continue",
  continueToPayment: "Continue",
} as const;

/** Homepage / hub occasion entry points → `/packages?vibe=` */
export const OCCASION_VIBES = [
  {
    key: "date_night",
    title: "Date Night",
    overlay: "from-rose-900/80 via-fuchsia-900/35 to-transparent",
  },
  {
    key: "girls_night",
    title: "Girls Night Out",
    overlay: "from-violet-950/85 via-purple-800/40 to-transparent",
  },
  {
    key: "birthday",
    title: "Birthday Celebration",
    overlay: "from-amber-950/80 via-fuchsia-900/35 to-transparent",
  },
  {
    key: "out_of_town",
    title: "Out of Town Weekend",
    overlay: "from-slate-950/85 via-indigo-900/40 to-transparent",
  },
  {
    key: "luxury",
    title: "Luxury Experience",
    overlay: "from-neutral-950/85 via-violet-900/45 to-transparent",
  },
] as const;

export type OccasionVibeKey = (typeof OCCASION_VIBES)[number]["key"];

export function occasionVibeLabel(key: string | null | undefined): string | null {
  if (!key) return null;
  return OCCASION_VIBES.find((v) => v.key === key)?.title ?? null;
}

export function slotMoodEmoji(slotType: string): string {
  switch (slotType) {
    case "brunch":
      return "🥂";
    case "day_party":
      return "🌴";
    case "lounge":
      return "🍸";
    case "night":
      return "🍾";
    case "after_hours":
      return "🌃";
    default:
      return "✨";
  }
}

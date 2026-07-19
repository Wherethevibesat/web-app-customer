import { listBrowseFeed, type BrowseItem } from "@/lib/browse-events";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { listVenues, type Venue } from "@/lib/data/venues";

export type ConciergeTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ConciergeRequest = {
  query: string;
  sessionId?: string;
  history?: ConciergeTurn[];
  context?: {
    timezone?: string;
    nowIso?: string;
    userId?: string;
  };
  filters?: {
    datePreset?: "tonight" | "this_weekend" | "custom" | null;
    dateIso?: string;
    neighborhood?: string;
    eventType?: string;
    maxPrice?: number;
    featuredOnly?: boolean;
  };
};

export type ConciergeRecommendation = {
  kind: "event" | "venue";
  id: string;
  title: string;
  subtitle: string;
  priceHint: string | null;
  reason: string;
  url: string;
  imageUrl: string | null;
};

export type ConciergeResponse = {
  reply: string;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  appliedFilters: {
    datePreset: "tonight" | "this_weekend" | "custom" | null;
    neighborhood: string | null;
    eventType: string | null;
    maxPrice: number | null;
    featuredOnly: boolean;
  };
  recommendations: ConciergeRecommendation[];
  suggestedChips: string[];
  debug: {
    candidateCount: number;
    rankedCount: number;
    llmConfigured?: boolean;
    llmReturned?: boolean;
    llmUsed?: boolean;
  };
};

type Candidate = {
  kind: "event" | "venue";
  id: string;
  title: string;
  eventType: string;
  neighborhood: string | null;
  startsAt: string;
  imageUrl: string | null;
  venueName: string | null;
  description: string | null;
  featured: boolean;
  rating: number | null;
  hoursLabel: string | null;
  url: string;
  score: number;
};

const QUERY_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "from",
  "i",
  "in",
  "is",
  "me",
  "near",
  "of",
  "on",
  "or",
  "show",
  "something",
  "that",
  "the",
  "to",
  "want",
  "with",
]);

function extractQueryTokens(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !QUERY_STOP_WORDS.has(t));
  return Array.from(new Set(tokens));
}

function buildCandidateSearchText(candidate: Candidate) {
  return [
    candidate.title,
    candidate.eventType,
    candidate.neighborhood ?? "",
    candidate.venueName ?? "",
    candidate.description ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function countTokenMatches(candidate: Candidate, tokens: string[]) {
  if (tokens.length === 0) return 0;
  const haystack = buildCandidateSearchText(candidate);
  let matches = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) matches += 1;
  }
  return matches;
}

function parseDatePreset(
  query: string,
  explicit?: "tonight" | "this_weekend" | "custom" | null,
) {
  if (explicit !== undefined) return explicit;
  const q = query.toLowerCase();
  if (q.includes("tonight")) return "tonight" as const;
  if (q.includes("weekend") || q.includes("this weekend")) return "this_weekend" as const;
  return null;
}

function parseEventType(query: string, knownTypes: string[], explicit?: string) {
  if (explicit?.trim()) return explicit.trim();
  const q = query.toLowerCase();
  return knownTypes.find((t) => q.includes(t.toLowerCase())) ?? null;
}

function parseEventTypeIntent(
  query: string,
  explicit: string | undefined,
): { preferred: string | null; acceptable: string[] } {
  if (explicit?.trim()) {
    return { preferred: explicit.trim(), acceptable: [explicit.trim()] };
  }

  const q = query.toLowerCase();
  const has = (...terms: string[]) => terms.some((t) => q.includes(t));

  if (has("day party", "dayparty", "day time", "daytime", "brunch")) {
    return {
      preferred: "Day Party",
      acceptable: ["Day Party", "Brunch / Daytime", "Happy Hours"],
    };
  }
  if (has("night party", "nightlife", "club", "turn up")) {
    return {
      preferred: "Night Party",
      acceptable: ["Night Party", "After Hours", "Live Music / DJ"],
    };
  }
  if (has("after hours", "afterhours", "late night")) {
    return {
      preferred: "After Hours",
      acceptable: ["After Hours", "Night Party"],
    };
  }
  if (has("happy hour", "happyhours", "happy hours")) {
    return {
      preferred: "Happy Hours",
      acceptable: ["Happy Hours", "Brunch / Daytime", "Day Party"],
    };
  }
  if (has("dj", "live music", "afrobeats", "afrobeat", "latin", "reggae", "hip hop", "hiphop")) {
    return {
      preferred: "Live Music / DJ",
      acceptable: ["Live Music / DJ", "Night Party", "Day Party"],
    };
  }
  if (has("hookah", "shisha")) {
    return {
      preferred: "Hookah Vibes",
      acceptable: ["Hookah Vibes", "Night Party", "Upscale"],
    };
  }
  if (has("upscale", "dressy", "fancy", "rooftop", "lounge")) {
    return {
      preferred: "Upscale",
      acceptable: ["Upscale", "Night Party", "Hookah Vibes"],
    };
  }
  if (has("private", "birthday", "table", "section", "bottle service")) {
    return {
      preferred: "Private Event",
      acceptable: ["Private Event", "Upscale", "Night Party"],
    };
  }
  if (has("25+", "25 and over")) {
    return {
      preferred: "25 and Over",
      acceptable: ["25 and Over", "30 and Over", "Upscale"],
    };
  }
  if (has("30+", "30 and over", "grown")) {
    return {
      preferred: "30 and Over",
      acceptable: ["30 and Over", "25 and Over", "Upscale"],
    };
  }

  const parsed = parseEventType(query, [
    "Day Party",
    "Night Party",
    "After Hours",
    "Brunch / Daytime",
    "Happy Hours",
    "Live Music / DJ",
    "Hookah Vibes",
    "25 and Over",
    "30 and Over",
    "Upscale",
    "Private Event",
  ]);
  return parsed ? { preferred: parsed, acceptable: [parsed] } : { preferred: null, acceptable: [] };
}

function parseNeighborhood(query: string, names: string[], explicit?: string) {
  if (explicit?.trim()) return explicit.trim();
  const q = query.toLowerCase();
  return names.find((n) => q.includes(n.toLowerCase())) ?? null;
}

function parseMaxPrice(query: string, explicit?: number) {
  if (typeof explicit === "number" && Number.isFinite(explicit)) return explicit;
  const m = query.match(/\$(\d{1,4})/);
  if (!m) return null;
  return Number(m[1]);
}

function parseWeekday(query: string): number | null {
  const q = query.toLowerCase();
  if (q.includes("sunday") || q.includes("sun ")) return 0;
  if (q.includes("monday") || q.includes("mon ")) return 1;
  if (q.includes("tuesday") || q.includes("tue ")) return 2;
  if (q.includes("wednesday") || q.includes("wed ")) return 3;
  if (q.includes("thursday") || q.includes("thu ")) return 4;
  if (q.includes("friday") || q.includes("fri ")) return 5;
  if (q.includes("saturday") || q.includes("sat ")) return 6;
  return null;
}

function endOfTonight(now: Date) {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}

function endOfWeekend(now: Date) {
  const d = new Date(now);
  const day = d.getDay();
  const add = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + add);
  d.setHours(23, 59, 59, 999);
  return d;
}

function scoreCandidate(
  candidate: Candidate,
  req: {
    query: string;
    queryTokens: string[];
    datePreset: "tonight" | "this_weekend" | "custom" | null;
    neighborhood: string | null;
    eventType: string | null;
    acceptableEventTypes: string[];
    featuredOnly: boolean;
  },
) {
  let score = candidate.featured ? 15 : 0;
  const q = req.query.toLowerCase();
  const tokenMatches = countTokenMatches(candidate, req.queryTokens);

  if (q && candidate.title.toLowerCase().includes(q)) score += 28;
  if (tokenMatches > 0) score += tokenMatches * 12;
  if (req.queryTokens.length > 0 && tokenMatches === 0) score -= 20;
  if (req.eventType && candidate.eventType.toLowerCase() === req.eventType.toLowerCase()) score += 25;
  if (
    req.eventType &&
    req.acceptableEventTypes.length > 1 &&
    req.acceptableEventTypes.some((t) => t.toLowerCase() === candidate.eventType.toLowerCase())
  ) {
    score += 10;
  }
  if (
    req.neighborhood &&
    (candidate.neighborhood ?? "").toLowerCase() === req.neighborhood.toLowerCase()
  ) {
    score += 25;
  }
  if (req.featuredOnly && candidate.featured) score += 15;

  if (candidate.kind === "event") {
    const starts = new Date(candidate.startsAt).getTime();
    const now = Date.now();
    const hours = Math.max((starts - now) / 3600000, 0);
    if (hours < 12) score += 10;
    else if (hours < 48) score += 6;
  }

  return score;
}

function formatEventSubtitle(c: Candidate) {
  const starts = new Date(c.startsAt);
  const when = starts.toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
  const where = c.neighborhood ?? c.venueName ?? "Houston";
  return `${when} · ${where}`;
}

function reasonForCandidate(
  c: Candidate,
  req: {
    datePreset: "tonight" | "this_weekend" | "custom" | null;
    neighborhood: string | null;
    eventType: string | null;
  },
): string {
  const bits: string[] = [];
  if (
    req.neighborhood &&
    (c.neighborhood ?? "").toLowerCase() === req.neighborhood.toLowerCase()
  ) {
    bits.push(`in ${c.neighborhood}`);
  }
  if (req.eventType && c.eventType.toLowerCase() === req.eventType.toLowerCase()) {
    bits.push(`a ${c.eventType.toLowerCase()} match`);
  }
  if (c.kind === "event" && req.datePreset === "tonight") bits.push("happening tonight");
  else if (c.kind === "event" && req.datePreset === "this_weekend") bits.push("on this weekend");
  if (c.featured) bits.push("a featured pick");
  if (c.kind === "venue" && typeof c.rating === "number" && c.rating >= 4.3) {
    bits.push(`highly rated (${c.rating.toFixed(1)}★)`);
  }
  if (bits.length === 0) {
    return c.kind === "event"
      ? "Popular upcoming option that fits your search."
      : "Solid spot that fits your vibe and area.";
  }
  const label = c.kind === "event" ? "This event is" : "This venue is";
  return `${label} ${bits.join(", ")}.`;
}

function buildDeterministicReply(
  recommendations: ConciergeRecommendation[],
  needsClarification: boolean,
) {
  if (needsClarification) {
    return "I can help with that. Tell me when and where you want to go, and I'll narrow it down.";
  }
  if (recommendations.length === 0) {
    return "I couldn't find strong matches right now. Try broadening your filters.";
  }
  return "Here are top matches based on your vibe, timing, and location.";
}

type LlmCandidate = {
  ref: string;
  kind: "event" | "venue";
  title: string;
  type: string;
  area: string;
  when: string;
  featured: boolean;
  rating: number | null;
  about: string;
};

type LlmSelection = {
  reply: string;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  picks: Array<{ ref: string; reason: string }>;
  suggestedChips: string[];
};

async function selectWithLlm(input: {
  query: string;
  history: ConciergeTurn[];
  nowIso: string;
  hints: {
    datePreset: "tonight" | "this_weekend" | "custom" | null;
    neighborhood: string | null;
    eventType: string | null;
    weekday: number | null;
    budgetMentioned: boolean;
    wants: "events" | "venues" | "both";
  };
  candidates: LlmCandidate[];
}): Promise<LlmSelection | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || input.candidates.length === 0) return null;

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const payload = {
    model,
    temperature: 0.3,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "concierge_selection",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            needsClarification: { type: "boolean" },
            clarificationQuestion: { type: ["string", "null"] },
            picks: {
              type: "array",
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  ref: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["ref", "reason"],
              },
            },
            suggestedChips: {
              type: "array",
              items: { type: "string" },
              maxItems: 6,
            },
          },
          required: [
            "reply",
            "needsClarification",
            "clarificationQuestion",
            "picks",
            "suggestedChips",
          ],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: [
          "You are the Vibes Concierge for a Houston nightlife discovery app.",
          "Recommend ONLY from the provided candidate list. Never invent venues, events, dates, prices, or details.",
          "Each pick's `ref` MUST be one of the candidate refs. Pick the best 3-6 matches for the user's intent (vibe, timing, neighborhood, event type). Order best first.",
          "Write ONE short, specific `reason` sentence per pick (max ~18 words) grounded in that candidate's real fields (type, area, timing, rating). Do not claim anything not present in the data.",
          "The app does NOT track ticket prices. If the user asks about budget/cheap/free, say you can't filter by exact price and suggest featured or no-cover-style options without inventing prices.",
          "Set needsClarification=true ONLY if the request is truly unusable (empty or contradictory). A vibe alone (e.g. 'somewhere chill') is enough — do not over-ask.",
          "reply: 1-2 warm, concise sentences. suggestedChips: up to 5 short helpful follow-up refinements.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          now: input.nowIso,
          conversation: input.history.slice(-6),
          request: input.query,
          hints: input.hints,
          candidates: input.candidates,
        }),
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[concierge] OpenAI HTTP", res.status, errText.slice(0, 400));
      return null;
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      console.error("[concierge] OpenAI returned empty content");
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<LlmSelection>;
    if (typeof parsed.reply !== "string") return null;
    return {
      reply: parsed.reply,
      needsClarification: Boolean(parsed.needsClarification),
      clarificationQuestion:
        typeof parsed.clarificationQuestion === "string" ? parsed.clarificationQuestion : null,
      picks: Array.isArray(parsed.picks)
        ? parsed.picks
            .filter(
              (p): p is { ref: string; reason: string } =>
                !!p && typeof p.ref === "string" && typeof p.reason === "string",
            )
            .slice(0, 6)
        : [],
      suggestedChips: Array.isArray(parsed.suggestedChips)
        ? parsed.suggestedChips.filter((c) => typeof c === "string").slice(0, 6)
        : [],
    };
  } catch (err) {
    console.error("[concierge] OpenAI call failed", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runConcierge(input: ConciergeRequest): Promise<ConciergeResponse> {
  const query = input.query?.trim() ?? "";
  const queryTokens = extractQueryTokens(query);
  const now = input.context?.nowIso ? new Date(input.context.nowIso) : new Date();

  const neighborhoods = await listNeighborhoodOptions().catch(() => []);
  const neighborhoodNames = neighborhoods.map((n) => n.name);

  const datePreset = parseDatePreset(query, input.filters?.datePreset);
  const neighborhood = parseNeighborhood(query, neighborhoodNames, input.filters?.neighborhood);
  const eventTypeIntent = parseEventTypeIntent(query, input.filters?.eventType);
  const eventType = eventTypeIntent.preferred;
  const acceptableEventTypes = eventTypeIntent.acceptable;
  const maxPrice = parseMaxPrice(query, input.filters?.maxPrice);
  const featuredOnly = Boolean(input.filters?.featuredOnly);
  const weekday = parseWeekday(query);

  // Only ask to clarify when there is genuinely no usable signal (e.g. "hi",
  // "help"). A vibe word, area, type, day, or time is enough to proceed.
  const hasSignal = Boolean(
    datePreset || neighborhood || eventType || weekday != null || queryTokens.length > 0,
  );
  const deterministicNeedsClarification = query.length === 0 || !hasSignal;
  const clarificationQuestion = deterministicNeedsClarification
    ? "Tell me a vibe (chill, dancing, hookah), an area, or a day and I'll pull the best spots."
    : null;

  const wants: "events" | "venues" | "both" = (() => {
    const q = query.toLowerCase();
    const venueWords = /(venue|spot|bar|lounge|club house|hookah bar|restaurant|place to|where can|rooftop)/;
    const eventWords = /(event|party|show|concert|dj set|lineup|performing|tonight|this weekend|happening)/;
    const wantsVenue = venueWords.test(q);
    const wantsEvent = eventWords.test(q) || datePreset != null || weekday != null;
    if (wantsVenue && !wantsEvent) return "venues";
    if (wantsEvent && !wantsVenue) return "events";
    return "both";
  })();

  const browseItems = await listBrowseFeed({
    featuredOnly,
    eventType: eventType ?? undefined,
    neighborhoods: neighborhood ? [neighborhood] : undefined,
    upcomingOnly: true,
    limit: 200,
  }).catch(() => [] as BrowseItem[]);
  const venues = await listVenues().catch(() => [] as Venue[]);

  const eventCandidates: Candidate[] = browseItems.map((item) => {
    if (item.kind === "event") {
      return {
        kind: "event",
        id: item.event.id,
        title: item.event.title,
        eventType: item.event.event_type,
        neighborhood: item.event.neighborhood,
        startsAt: item.event.starts_at,
        imageUrl: item.event.image_url,
        venueName: item.event.venue?.name ?? null,
        description: item.event.description ?? null,
        featured: Boolean(item.event.featured || item.event.homepage_featured),
        rating: null,
        hoursLabel: null,
        url: `/events/${item.event.id}`,
        score: 0,
      };
    }
    return {
      kind: "event",
      id: item.series.nextOccurrence.id,
      title: item.series.title,
      eventType: item.series.event_type,
      neighborhood: item.series.neighborhood,
      startsAt: item.series.nextOccurrence.starts_at,
      imageUrl: item.series.image_url ?? item.series.nextOccurrence.image_url ?? null,
      venueName: item.series.venue?.name ?? null,
      description: item.series.description ?? null,
      featured: Boolean(item.series.featured),
      rating: null,
      hoursLabel: null,
      url: `/events/series/${item.series.id}`,
      score: 0,
    };
  });

  const venueCandidates: Candidate[] = venues.slice(0, 80).map((v) => ({
    kind: "venue",
    id: v.id,
    title: v.name,
    eventType: v.venue_type,
    neighborhood: v.neighborhood,
    startsAt: now.toISOString(),
    imageUrl: v.image_url,
    venueName: v.name,
    description: v.description,
    featured: Boolean(v.featured),
    rating: v.rating ?? null,
    hoursLabel: v.hours_label ?? null,
    url: `/venues/${v.id}`,
    score: 0,
  }));

  let candidates = [...eventCandidates, ...venueCandidates];

  if (datePreset) {
    candidates = candidates.filter((c) => {
      if (c.kind !== "event") return true;
      const starts = new Date(c.startsAt);
      if (datePreset === "tonight") return starts <= endOfTonight(now);
      if (datePreset === "this_weekend") return starts <= endOfWeekend(now);
      return true;
    });
  }
  if (weekday != null) {
    candidates = candidates.filter((c) => {
      if (c.kind !== "event") return true;
      return new Date(c.startsAt).getDay() === weekday;
    });
  }

  if (neighborhood) {
    candidates = candidates.filter(
      (c) => (c.neighborhood ?? "").toLowerCase() === neighborhood.toLowerCase(),
    );
  }
  if (acceptableEventTypes.length > 0) {
    const acceptableSet = new Set(acceptableEventTypes.map((t) => t.toLowerCase()));
    candidates = candidates.filter((c) => acceptableSet.has(c.eventType.toLowerCase()));
  }

  // If strict filters eliminate everything, relax type first, then neighborhood.
  if (candidates.length === 0) {
    candidates = [...eventCandidates, ...venueCandidates];
    if (datePreset) {
      candidates = candidates.filter((c) => {
        if (c.kind !== "event") return true;
        const starts = new Date(c.startsAt);
        if (datePreset === "tonight") return starts <= endOfTonight(now);
        if (datePreset === "this_weekend") return starts <= endOfWeekend(now);
        return true;
      });
    }
    if (weekday != null) {
      candidates = candidates.filter((c) => {
        if (c.kind !== "event") return true;
        return new Date(c.startsAt).getDay() === weekday;
      });
    }
    if (neighborhood) {
      candidates = candidates.filter(
        (c) => (c.neighborhood ?? "").toLowerCase() === neighborhood.toLowerCase(),
      );
    }
  }
  if (candidates.length === 0) {
    candidates = [...eventCandidates, ...venueCandidates];
    if (datePreset) {
      candidates = candidates.filter((c) => {
        if (c.kind !== "event") return true;
        const starts = new Date(c.startsAt);
        if (datePreset === "tonight") return starts <= endOfTonight(now);
        if (datePreset === "this_weekend") return starts <= endOfWeekend(now);
        return true;
      });
    }
    if (weekday != null) {
      candidates = candidates.filter((c) => {
        if (c.kind !== "event") return true;
        return new Date(c.startsAt).getDay() === weekday;
      });
    }
  }

  candidates = candidates
    .map((c) => ({
      ...c,
      score: scoreCandidate(c, {
        query,
        queryTokens,
        datePreset,
        neighborhood,
        eventType,
        acceptableEventTypes,
        featuredOnly,
      }),
    }))
    .sort((a, b) => b.score - a.score);

  // Respect events-vs-venues intent, but keep a few of the other kind as filler.
  if (wants === "events") {
    const events = candidates.filter((c) => c.kind === "event");
    if (events.length >= 3) candidates = events;
  } else if (wants === "venues") {
    const venuesOnly = candidates.filter((c) => c.kind === "venue");
    if (venuesOnly.length >= 3) candidates = venuesOnly;
  }

  if (queryTokens.length > 0) {
    const matched = candidates.filter((c) => countTokenMatches(c, queryTokens) > 0);
    if (matched.length >= 3) {
      candidates = matched;
    }
  }

  // Bounded, relevant pool handed to the LLM for grounded semantic ranking.
  // For a "both" intent, guarantee venues a share of the pool so time-proximity
  // scoring on events can't crowd venues out entirely.
  let pool: Candidate[];
  if (wants === "both") {
    const topEvents = candidates.filter((c) => c.kind === "event").slice(0, 28);
    const topVenues = candidates.filter((c) => c.kind === "venue").slice(0, 14);
    pool = [...topEvents, ...topVenues].sort((a, b) => b.score - a.score).slice(0, 40);
  } else {
    pool = candidates.slice(0, 40);
  }
  const byRef = new Map<string, Candidate>();
  const llmCandidates: LlmCandidate[] = pool.map((c, i) => {
    const ref = `${c.kind === "event" ? "e" : "v"}${i}`;
    byRef.set(ref, c);
    return {
      ref,
      kind: c.kind,
      title: c.title,
      type: c.eventType,
      area: c.neighborhood ?? "Houston",
      when:
        c.kind === "event"
          ? formatEventSubtitle(c)
          : c.hoursLabel ?? "Venue",
      featured: c.featured,
      rating: c.rating,
      about: (c.description ?? "").slice(0, 180),
    };
  });

  const reasonHints = { datePreset, neighborhood, eventType };
  const toRecommendation = (c: Candidate, reason: string): ConciergeRecommendation => ({
    kind: c.kind,
    id: c.id,
    title: c.title,
    subtitle:
      c.kind === "event"
        ? formatEventSubtitle(c)
        : `${c.neighborhood ?? "Houston"} · ${c.eventType}`,
    priceHint: c.featured ? "Featured pick" : null,
    reason,
    url: c.url,
    imageUrl: c.imageUrl,
  });

  const baseChips = ["Tonight", "This weekend", "Featured", "Hookah Vibes", "Upscale"];

  const llm = await selectWithLlm({
    query,
    history: input.history ?? [],
    nowIso: now.toISOString(),
    hints: {
      datePreset,
      neighborhood,
      eventType,
      weekday,
      budgetMentioned: maxPrice != null,
      wants,
    },
    candidates: llmCandidates,
  });

  let recommendations: ConciergeRecommendation[] = [];
  let needsClarification = deterministicNeedsClarification;
  let finalClarification = clarificationQuestion;
  let reply: string;
  let suggestedChips: string[];

  const llmPicks = llm?.picks
    .map((p) => ({ candidate: byRef.get(p.ref), reason: p.reason }))
    .filter((p): p is { candidate: Candidate; reason: string } => Boolean(p.candidate));

  if (llm && llmPicks && llmPicks.length > 0) {
    // Grounded LLM ranking: only real candidates it selected, in its order.
    const seen = new Set<string>();
    recommendations = llmPicks
      .filter((p) => {
        const key = `${p.candidate.kind}-${p.candidate.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((p) => toRecommendation(p.candidate, p.reason.trim() || reasonForCandidate(p.candidate, reasonHints)))
      .slice(0, 6);
    needsClarification = false;
    finalClarification = null;
    reply = llm.reply;
    suggestedChips = llm.suggestedChips.length ? llm.suggestedChips : baseChips;
  } else {
    // Deterministic fallback (no API key, timeout, or invalid output).
    recommendations = pool
      .slice(0, 8)
      .map((c) => toRecommendation(c, reasonForCandidate(c, reasonHints)));
    if (llm) {
      needsClarification = llm.needsClarification;
      finalClarification = llm.clarificationQuestion ?? clarificationQuestion;
      reply = llm.reply;
      suggestedChips = llm.suggestedChips.length ? llm.suggestedChips : baseChips;
    } else {
      reply = buildDeterministicReply(recommendations, needsClarification);
      suggestedChips = baseChips;
    }
  }

  return {
    reply,
    needsClarification,
    clarificationQuestion: finalClarification,
    appliedFilters: {
      datePreset,
      neighborhood,
      eventType,
      maxPrice,
      featuredOnly,
    },
    recommendations,
    suggestedChips,
    debug: {
      candidateCount: candidates.length,
      rankedCount: recommendations.length,
      llmConfigured: Boolean(process.env.OPENAI_API_KEY),
      llmReturned: Boolean(llm),
      llmUsed: Boolean(llm && llmPicks && llmPicks.length > 0),
    },
  };
}

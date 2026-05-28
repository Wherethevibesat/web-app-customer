import { listBrowseFeed, type BrowseItem } from "@/lib/browse-events";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { listVenues, type Venue } from "@/lib/data/venues";

export type ConciergeRequest = {
  query: string;
  sessionId?: string;
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
  };
};

type Candidate =
  | {
      kind: "event";
      id: string;
      title: string;
      eventType: string;
      neighborhood: string | null;
      startsAt: string;
      imageUrl: string | null;
      venueName: string | null;
      description: string | null;
      featured: boolean;
      url: string;
      score: number;
    }
  | {
      kind: "venue";
      id: string;
      title: string;
      eventType: string;
      neighborhood: string | null;
      startsAt: string;
      imageUrl: string | null;
      venueName: string | null;
      description: string | null;
      featured: boolean;
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

function formatEventSubtitle(c: Extract<Candidate, { kind: "event" }>) {
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

async function tryLlmRewrite(input: {
  query: string;
  recommendations: ConciergeRecommendation[];
  needsClarification: boolean;
  clarificationQuestion: string | null;
}): Promise<Pick<ConciergeResponse, "reply" | "suggestedChips"> | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const payload = {
    model,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "concierge_copy",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            reply: { type: "string" },
            suggestedChips: {
              type: "array",
              items: { type: "string" },
              maxItems: 6,
            },
          },
          required: ["reply", "suggestedChips"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content:
          "You write concise nightlife concierge replies. Never invent events. Use only provided recommendations.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { reply?: string; suggestedChips?: string[] };
    if (!parsed.reply) return null;
    return {
      reply: parsed.reply,
      suggestedChips: parsed.suggestedChips?.slice(0, 6) ?? [],
    };
  } catch {
    return null;
  }
}

export async function runConcierge(input: ConciergeRequest): Promise<ConciergeResponse> {
  const query = input.query?.trim() ?? "";
  const queryTokens = extractQueryTokens(query);
  const now = input.context?.nowIso ? new Date(input.context.nowIso) : new Date();

  const neighborhoods = await listNeighborhoodOptions().catch(() => []);
  const neighborhoodNames = neighborhoods.map((n) => n.name);
  const knownTypes = [
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
  ];

  const datePreset = parseDatePreset(query, input.filters?.datePreset);
  const neighborhood = parseNeighborhood(query, neighborhoodNames, input.filters?.neighborhood);
  const eventTypeIntent = parseEventTypeIntent(query, input.filters?.eventType);
  const eventType = eventTypeIntent.preferred;
  const acceptableEventTypes = eventTypeIntent.acceptable;
  const maxPrice = parseMaxPrice(query, input.filters?.maxPrice);
  const featuredOnly = Boolean(input.filters?.featuredOnly);
  const weekday = parseWeekday(query);

  const genericQuery =
    query.length < 6 ||
    queryTokens.length === 0 ||
    /(something fun|what's good|what should i do|anything tonight)/i.test(query);
  const needsClarification = genericQuery && !datePreset && !neighborhood;
  const clarificationQuestion = needsClarification
    ? "Do you want tonight, this weekend, or a specific date — and which area?"
    : null;

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

  if (queryTokens.length > 0) {
    const matched = candidates.filter((c) => countTokenMatches(c, queryTokens) > 0);
    if (matched.length >= 3) {
      candidates = matched;
    }
  }

  const ranked = candidates.slice(0, 8);
  const recommendations: ConciergeRecommendation[] = ranked.map((c) => ({
    kind: c.kind,
    id: c.id,
    title: c.title,
    subtitle: c.kind === "event" ? formatEventSubtitle(c) : `${c.neighborhood ?? "Houston"} · ${c.eventType}`,
    priceHint:
      maxPrice != null ? `Budget target: $${maxPrice}` : c.featured ? "Featured pick" : null,
    reason:
      c.kind === "event"
        ? "Matches your timing, vibe, and location filters."
        : "Good venue match for your requested vibe and area.",
    url: c.url,
    imageUrl: c.imageUrl,
  }));

  const baseChips = ["Tonight", "This weekend", "Featured", "Hookah Vibes", "Upscale"];
  const llm = await tryLlmRewrite({
    query,
    recommendations,
    needsClarification,
    clarificationQuestion,
  });

  return {
    reply: llm?.reply ?? buildDeterministicReply(recommendations, needsClarification),
    needsClarification,
    clarificationQuestion,
    appliedFilters: {
      datePreset,
      neighborhood,
      eventType,
      maxPrice,
      featuredOnly,
    },
    recommendations,
    suggestedChips: llm?.suggestedChips?.length ? llm.suggestedChips : baseChips,
    debug: {
      candidateCount: candidates.length,
      rankedCount: recommendations.length,
    },
  };
}

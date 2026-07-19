"use client";

import Link from "next/link";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ConciergeResponse = {
  reply: string;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  recommendations: Array<{
    kind: "event" | "venue";
    id: string;
    title: string;
    subtitle: string;
    priceHint: string | null;
    reason: string;
    url: string;
  }>;
  suggestedChips: string[];
};

type ChatTurn = {
  id: string;
  query: string;
  result?: ConciergeResponse;
  error?: string;
};

function generateSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `concierge-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ConciergeWidget({ floating = true }: { floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const sessionId = useMemo(() => generateSessionId(), []);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [turns, busy, open]);

  async function ask(nextQuery?: string) {
    const prompt = (nextQuery ?? query).trim();
    if (!prompt) return;
    setBusy(true);
    if (!nextQuery) setQuery("");
    const history = turns
      .flatMap((turn) =>
        turn.result
          ? [
              { role: "user" as const, content: turn.query },
              { role: "assistant" as const, content: turn.result.reply },
            ]
          : [],
      )
      .slice(-6);
    const res = await fetch("/api/ai/concierge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: prompt, sessionId, history }),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<ConciergeResponse> & {
      error?: string;
    };
    setBusy(false);

    if (!res.ok) {
      setTurns((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          query: prompt,
          error: data.error ?? "Could not get recommendations right now.",
        },
      ]);
      return;
    }

    const result: ConciergeResponse = {
      reply: data.reply ?? "",
      needsClarification: Boolean(data.needsClarification),
      clarificationQuestion: data.clarificationQuestion ?? null,
      recommendations: data.recommendations ?? [],
      suggestedChips: data.suggestedChips ?? [],
    };
    setTurns((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        query: prompt,
        result,
      },
    ]);
    if (nextQuery) setQuery("");
  }

  async function trackClick(rec: ConciergeResponse["recommendations"][number], queryText: string) {
    try {
      await fetch("/api/ai/concierge/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText.trim() || undefined,
          sessionId,
          recommendation: {
            kind: rec.kind,
            id: rec.id,
            title: rec.title,
            url: rec.url,
          },
        }),
      });
    } catch {
      // Ignore analytics failures in UI interactions.
    }
  }

  function clearChat() {
    setTurns([]);
    setQuery("");
  }

  const chatContent = (
    <>
      <div
        ref={listRef}
        className="h-[340px] space-y-3 overflow-y-auto rounded-xl border border-wtva-dark-300 bg-wtva-dark-400 p-3 md:h-[390px]"
      >
        {turns.length === 0 ? (
          <p className="text-sm text-wtva-muted">
            Ask for a vibe, area, day, or budget and I will suggest matching events and venues.
          </p>
        ) : null}

        {turns.map((turn) => (
          <div key={turn.id} className="space-y-2">
            <div className="ml-auto max-w-[85%] rounded-xl bg-foreground px-3 py-2 text-sm text-background">
              {turn.query}
            </div>

            {turn.error ? (
              <div className="max-w-[90%] rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {turn.error}
              </div>
            ) : null}

            {turn.result ? (
              <div className="max-w-[95%] space-y-3 rounded-xl border border-wtva-dark-300 bg-wtva-card px-3 py-3">
                <p className="text-sm">{turn.result.reply}</p>
                {turn.result.clarificationQuestion ? (
                  <p className="text-sm text-wtva-muted">{turn.result.clarificationQuestion}</p>
                ) : null}

                {turn.result.suggestedChips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {turn.result.suggestedChips.slice(0, 5).map((chip) => (
                      <button
                        key={`${turn.id}-${chip}`}
                        type="button"
                        onClick={() => ask(chip)}
                        className="rounded-full border border-wtva-dark-300 px-3 py-1 text-xs text-wtva-muted hover:border-wtva-muted"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-2">
                  {turn.result.recommendations.map((r) => (
                    <Link
                      key={`${turn.id}-${r.kind}-${r.id}`}
                      href={r.url}
                      onClick={() => void trackClick(r, turn.query)}
                      className="block rounded-lg border border-wtva-dark-300 p-3 hover:border-wtva-muted"
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-wtva-muted">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {r.kind}
                      </div>
                      <p className="mt-1 font-semibold">{r.title}</p>
                      <p className="text-sm text-wtva-muted">{r.subtitle}</p>
                      {r.reason ? <p className="mt-1 text-xs text-wtva-subtle">{r.reason}</p> : null}
                      {r.priceHint ? (
                        <p className="mt-1 text-xs font-medium text-accent">{r.priceHint}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {busy ? <p className="text-sm text-wtva-muted">Concierge is thinking...</p> : null}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tell me what vibe you want..."
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors disabled:opacity-50"
        >
          {busy ? "..." : "Ask"}
        </button>
      </form>
    </>
  );

  if (!floating) {
    return (
      <div className="w-full rounded-2xl border border-wtva-dark-300 bg-wtva-card p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-wtva-muted" />
            <h3 className="font-semibold">Vibes Concierge</h3>
          </div>
          <button
            type="button"
            onClick={clearChat}
            disabled={busy || (turns.length === 0 && !query)}
            className="rounded px-2 py-1 text-xs text-wtva-muted hover:bg-wtva-dark-300 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
        {chatContent}
      </div>
    );
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-lg md:bottom-6"
        >
          <Sparkles className="h-4 w-4" />
          Ask Concierge
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[min(420px,calc(100vw-1rem))] rounded-2xl border border-wtva-dark-300 bg-wtva-card p-4 shadow-2xl md:bottom-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-wtva-muted" />
                <h3 className="font-semibold">Vibes Concierge</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={busy || (turns.length === 0 && !query)}
                  className="rounded px-2 py-1 text-xs text-wtva-muted hover:bg-wtva-dark-300 disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-1 text-wtva-muted hover:bg-wtva-dark-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {chatContent}
        </div>
      )}
    </>
  );
}

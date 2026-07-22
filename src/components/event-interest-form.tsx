"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { buttonClass } from "@/lib/button";

const INPUT =
  "w-full rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm outline-none focus:border-accent";

const VIBE_CHIPS = [
  "Afrobeats",
  "Happy Hour",
  "Rooftop",
  "Live Music",
  "Day Party",
  "VIP",
  "After Hours",
];

export type EventInterestSource = "notify_me" | "tip_a_night" | "empty_feed";

export function EventInterestForm({
  source,
  eventId,
  venueId,
  eventTitle,
  initialCity = "Houston, TX",
  compact = false,
}: {
  source: EventInterestSource;
  eventId?: string | null;
  venueId?: string | null;
  eventTitle?: string | null;
  initialCity?: string;
  compact?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState(initialCity);
  const [neighborhood, setNeighborhood] = useState("");
  const [vibe, setVibe] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isNotify = source === "notify_me";
  const title = isNotify
    ? "Get updates for this night"
    : source === "empty_feed"
      ? "What’s the move?"
      : "Tip a night";
  const subtitle = isNotify
    ? `Leave your email and we’ll ping you when tickets, VIP, or updates drop${
        eventTitle ? ` for ${eventTitle}` : ""
      }.`
    : "Tell us what you want to see — venues, DJs, vibes. We’ll use it to book the calendar.";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/event-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        city,
        neighborhood,
        vibe,
        note,
        source,
        eventId: eventId ?? undefined,
        venueId: venueId ?? undefined,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div
        className={`rounded-2xl border border-wtva-dark-300 bg-wtva-card text-center shadow-card ${
          compact ? "p-6" : "p-8"
        }`}
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
        <h3 className="mt-3 text-lg font-bold">Got it</h3>
        <p className="mt-2 text-sm text-wtva-muted">
          Thanks{name ? `, ${name}` : ""}! We’ll follow up when there’s a night that matches.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-wtva-dark-300 bg-wtva-card shadow-card ${
        compact ? "p-5 space-y-3" : "p-6 space-y-4 md:p-8"
      }`}
    >
      <div>
        <h3 className="text-lg font-bold md:text-xl">{title}</h3>
        <p className="mt-1 text-sm text-wtva-muted">{subtitle}</p>
      </div>

      {!isNotify && (
        <div className="flex flex-wrap gap-2">
          {VIBE_CHIPS.map((chip) => {
            const selected = vibe === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setVibe(selected ? "" : chip)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selected
                    ? "border-transparent bg-accent-gradient text-white"
                    : "border-wtva-dark-300 bg-wtva-page text-wtva-muted hover:border-accent/40"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      )}

      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <div className={compact ? undefined : "sm:col-span-2"}>
          <label className="mb-1 block text-xs font-medium text-wtva-muted">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@email.com"
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-wtva-muted">
            Name <span className="text-wtva-subtle">(optional)</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Your name"
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-wtva-muted">City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Houston, TX"
            className={INPUT}
          />
        </div>
      </div>

      {!isNotify && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-wtva-muted">
              Neighborhood <span className="text-wtva-subtle">(optional)</span>
            </label>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Midtown, Downtown…"
              className={INPUT}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-wtva-muted">
              Tip details
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={compact ? 2 : 3}
              placeholder="DJ, venue, date vibes — whatever you want to see on the calendar"
              className={INPUT}
            />
          </div>
        </>
      )}

      {isNotify && (
        <div>
          <label className="mb-1 block text-xs font-medium text-wtva-muted">
            Anything else? <span className="text-wtva-subtle">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. tell me when VIP opens"
            className={INPUT}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={loading} className={buttonClass("primary", "lg", "w-full")}>
        {loading ? "Sending…" : isNotify ? "Notify me" : "Send tip"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { buttonClass } from "@/lib/button";
import { COMING_SOON_CITIES } from "@/lib/cities";

const INPUT =
  "w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm outline-none focus:border-accent";

export function RequestCityForm({
  initialCity = "",
  source = "request_form",
}: {
  initialCity?: string;
  source?: "request_form" | "coming_soon";
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState(initialCity);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/request-city", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, city, note, source }),
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
      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
        <h2 className="mt-4 text-xl font-bold">You&apos;re on the list</h2>
        <p className="mt-2 text-sm text-wtva-muted">
          Thanks{name ? `, ${name}` : ""}! We&apos;ll email you the moment Where The Vibes At
          goes live in {city || "your city"}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-wtva-muted">City</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          list="wtva-city-options"
          required
          placeholder="Which city should we launch in?"
          className={INPUT}
        />
        <datalist id="wtva-city-options">
          {COMING_SOON_CITIES.map((c) => (
            <option key={c.slug} value={`${c.name}, ${c.state}`} />
          ))}
        </datalist>
      </div>

      <div>
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
        <label className="mb-1 block text-xs font-medium text-wtva-muted">
          Anything else? <span className="text-wtva-subtle">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Favorite venues, what you'd want to see, etc."
          className={INPUT}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {loading ? "Sending…" : "Request this city"}
      </button>
    </form>
  );
}

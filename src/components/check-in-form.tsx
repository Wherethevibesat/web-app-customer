"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CheckInForm({
  venues,
  defaultVenueId,
}: {
  venues: { id: string; name: string }[];
  defaultVenueId?: string;
}) {
  const router = useRouter();
  const initial =
    defaultVenueId && venues.some((v) => v.id === defaultVenueId)
      ? defaultVenueId
      : venues[0]?.id ?? "";
  const [venueId, setVenueId] = useState(initial);

  useEffect(() => {
    if (defaultVenueId && venues.some((v) => v.id === defaultVenueId)) {
      setVenueId(defaultVenueId);
    }
  }, [defaultVenueId, venues]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/check-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId, caption }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 401) {
      router.push("/auth/login?next=/check-in");
      return;
    }
    if (!res.ok) {
      setResult(body.error ?? "Check-in failed");
      return;
    }
    setResult(`+${body.pointsAwarded} points! Total: ${body.totalPoints}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-wtva-muted">Venue</label>
        <select
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        >
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-wtva-muted">Caption (optional)</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        />
      </div>
      {result && <p className="text-sm text-green-400">{result}</p>}
      <button
        type="submit"
        disabled={loading || !venueId}
        className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Checking in…" : "Check in (+25 points)"}
      </button>
    </form>
  );
}

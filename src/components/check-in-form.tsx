"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CheckInSuccess = {
  pointsAwarded: number;
  basePoints: number;
  totalPoints: number;
  firstVisit: boolean;
  firstVisitBonus: number;
  streak: boolean;
  streakBonus: number;
};

type Coords = { lat: number; lng: number; accuracy: number };

function getCoords(): Promise<Coords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  });
}

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
  const [success, setSuccess] = useState<CheckInSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setLoading(true);
    setSuccess(null);
    setError(null);

    const coords = await getCoords();
    const res = await fetch("/api/check-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId,
        caption,
        lat: coords?.lat,
        lng: coords?.lng,
        accuracy: coords?.accuracy,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.status === 401) {
      router.push("/auth/login?next=/check-in");
      return;
    }
    if (!res.ok) {
      setError(body.error ?? "Check-in failed");
      return;
    }
    setSuccess(body as CheckInSuccess);
    setCaption("");
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

      {success && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
          <p className="font-semibold text-emerald-400">
            +{success.pointsAwarded} points! Total: {success.totalPoints.toLocaleString()}
          </p>
          <ul className="mt-2 space-y-0.5 text-wtva-muted">
            <li>Check-in · +{success.basePoints}</li>
            {success.firstVisit && <li>First visit bonus · +{success.firstVisitBonus}</li>}
            {success.streak && <li>Daily streak · +{success.streakBonus}</li>}
          </ul>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading || !venueId}
        className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Checking in…" : "Check in"}
      </button>
      <p className="text-center text-xs text-wtva-muted">
        Location is used to confirm you&apos;re at the venue.
      </p>
    </form>
  );
}

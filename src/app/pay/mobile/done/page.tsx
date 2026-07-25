"use client";

import { useEffect } from "react";

export default function MobilePayDonePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pi = params.get("payment_intent") ?? params.get("pi") ?? "";
    const qs = pi ? `?pi=${encodeURIComponent(pi)}&ok=1` : "?ok=1";
    window.location.href = `wherethevibesat://pay-complete${qs}`;
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-wtva-dark-500 px-4">
      <div className="max-w-sm space-y-2 text-center">
        <p className="text-lg font-bold text-foreground">Payment complete</p>
        <p className="text-sm text-wtva-muted">
          Returning to the Where The Vibes At app…
        </p>
      </div>
    </main>
  );
}

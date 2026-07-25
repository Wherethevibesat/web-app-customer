"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/lib/button";

const TTL_OPTIONS = [
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 360, label: "6 hours" },
  { minutes: 1440, label: "24 hours" },
  { minutes: 2880, label: "48 hours" },
] as const;

function evenSplitDollars(totalDollars: number, n: number): number[] {
  const cents = Math.round(totalDollars * 100);
  const base = Math.floor(cents / n);
  const rem = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i === 0 ? rem : 0)) / 100);
}

export function VibeSplitCheckout({
  packageId,
  partySize,
  stopOfferIds,
  startsOn,
  /** Estimated total in dollars from the checkout page breakdown (fallback). */
  estimatedTotal,
}: {
  packageId: string;
  publishableKey: string;
  partySize: number;
  stopOfferIds: string[];
  startsOn: string;
  estimatedTotal?: number;
}) {
  const router = useRouter();
  const [payerCount, setPayerCount] = useState(2);
  const [splitMode, setSplitMode] = useState<"even" | "custom">("even");
  const [expiresInMinutes, setExpiresInMinutes] = useState(1440);
  const [guestEmails, setGuestEmails] = useState<string[]>([""]);
  const [customAmounts, setCustomAmounts] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalHint, setTotalHint] = useState(estimatedTotal ?? 0);

  useEffect(() => {
    setGuestEmails((prev) => {
      const next = Array.from({ length: payerCount - 1 }, (_, i) => prev[i] ?? "");
      return next;
    });
  }, [payerCount]);

  useEffect(() => {
    if (estimatedTotal && estimatedTotal > 0) setTotalHint(estimatedTotal);
  }, [estimatedTotal]);

  useEffect(() => {
    if (splitMode !== "custom") return;
    const even = evenSplitDollars(totalHint || 0, payerCount);
    setCustomAmounts(even.map((n) => n.toFixed(2)));
  }, [splitMode, payerCount, totalHint]);

  const previewAmounts = useMemo(() => {
    if (splitMode === "custom") {
      return customAmounts.map((s) => Number(s) || 0);
    }
    return evenSplitDollars(totalHint || 0, payerCount);
  }, [splitMode, customAmounts, totalHint, payerCount]);

  const money = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(n);

  async function sendRequests() {
    setCreating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        packageId,
        partySize,
        stopOfferIds,
        startsOn,
        payerCount,
        splitMode,
        guestEmails: guestEmails.map((e) => e.trim()),
        expiresInMinutes,
      };
      if (splitMode === "custom") {
        body.amountCents = customAmounts.map((s) =>
          Math.round((Number(s) || 0) * 100),
        );
      }
      const res = await fetch("/api/checkout/night-package/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send split requests");
        return;
      }
      if (typeof data.total === "number") setTotalHint(data.total);
      router.push(`/packages/split/${data.inviteToken}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  const customSum = customAmounts.reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <div className="space-y-5">
      <label className="block text-sm">
        <span className="font-medium">How many people are paying?</span>
        <select
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 font-semibold"
          value={payerCount}
          onChange={(e) => setPayerCount(Number(e.target.value))}
        >
          {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
            <option key={n} value={n}>
              {n} people
            </option>
          ))}
        </select>
      </label>

      <div className="inline-flex gap-1 rounded-full border border-wtva-dark-300 bg-wtva-dark-400 p-1">
        <button
          type="button"
          onClick={() => setSplitMode("even")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            splitMode === "even"
              ? "bg-accent-gradient text-white shadow-accent"
              : "text-wtva-muted"
          }`}
        >
          Even split
        </button>
        <button
          type="button"
          onClick={() => setSplitMode("custom")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            splitMode === "custom"
              ? "bg-accent-gradient text-white shadow-accent"
              : "text-wtva-muted"
          }`}
        >
          Custom amounts
        </button>
      </div>

      <div className="space-y-3 rounded-xl border border-wtva-dark-300 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-wtva-muted">Your share (host)</span>
          {splitMode === "even" ? (
            <span className="font-semibold">{money(previewAmounts[0] ?? 0)}</span>
          ) : (
            <input
              type="number"
              min={0.5}
              step="0.01"
              className="w-28 rounded-lg border border-wtva-dark-300 bg-wtva-card px-2 py-1 text-right font-semibold"
              value={customAmounts[0] ?? ""}
              onChange={(e) => {
                const next = [...customAmounts];
                next[0] = e.target.value;
                setCustomAmounts(next);
              }}
            />
          )}
        </div>
        {guestEmails.map((email, i) => (
          <div key={i} className="space-y-1">
            <label className="block text-xs font-medium text-wtva-muted">
              Friend {i + 1} email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder="friend@email.com"
                className="min-w-0 flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
                value={email}
                onChange={(e) => {
                  const next = [...guestEmails];
                  next[i] = e.target.value;
                  setGuestEmails(next);
                }}
              />
              {splitMode === "custom" ? (
                <input
                  type="number"
                  min={0.5}
                  step="0.01"
                  className="w-28 rounded-lg border border-wtva-dark-300 bg-wtva-card px-2 py-1 text-right text-sm font-semibold"
                  value={customAmounts[i + 1] ?? ""}
                  onChange={(e) => {
                    const next = [...customAmounts];
                    next[i + 1] = e.target.value;
                    setCustomAmounts(next);
                  }}
                />
              ) : (
                <span className="flex w-28 items-center justify-end text-sm font-semibold tabular-nums">
                  {money(previewAmounts[i + 1] ?? 0)}
                </span>
              )}
            </div>
          </div>
        ))}
        {splitMode === "custom" && totalHint > 0 && (
          <p
            className={`text-xs ${
              Math.abs(customSum - totalHint) < 0.01
                ? "text-wtva-muted"
                : "text-red-500"
            }`}
          >
            Sum {money(customSum)} · must equal {money(totalHint)}
          </p>
        )}
      </div>

      <label className="block text-sm">
        <span className="font-medium">Friends have until</span>
        <select
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 font-semibold"
          value={expiresInMinutes}
          onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
        >
          {TTL_OPTIONS.map((o) => (
            <option key={o.minutes} value={o.minutes}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <p className="text-sm text-wtva-muted">
        We&apos;ll email each friend a pay link. You can pay your share now or
        later — the vibe books only when everyone has paid. If time runs out,
        unpaid shares expire; paid shares are not auto-refunded.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        disabled={creating}
        onClick={sendRequests}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {creating ? "Sending…" : "Send payment requests"}
      </button>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/lib/button";

export function RewardRedeemButton({
  rewardId,
  costPoints,
  affordable,
  outOfStock,
}: {
  rewardId: string;
  costPoints: number;
  affordable: boolean;
  outOfStock: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function redeem() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 401) {
      router.push("/auth/login?next=/rewards");
      return;
    }
    if (!res.ok) {
      setError(body.error ?? "Redemption failed");
      return;
    }
    setCode(body.code as string);
    router.refresh();
  }

  if (code) {
    return (
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
        <p className="text-xs text-wtva-muted">Show this code at the venue</p>
        <p className="mt-1 font-mono text-xl font-bold tracking-widest text-emerald-400">{code}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={redeem}
        disabled={loading || !affordable || outOfStock}
        className={buttonClass("primary", "md", "w-full")}
      >
        {outOfStock
          ? "Out of stock"
          : loading
            ? "Redeeming…"
            : affordable
              ? `Redeem · ${costPoints.toLocaleString()} pts`
              : `Need ${costPoints.toLocaleString()} pts`}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

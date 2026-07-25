"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { buttonClass } from "@/lib/button";
import { vibeCopy } from "@/lib/vibe-copy";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

function CheckoutForm({
  packageId,
  partySize,
  stopOfferIds,
  startsOn,
}: {
  packageId: string;
  partySize: number;
  stopOfferIds: string[];
  startsOn: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      done: "1",
      party: String(partySize),
      stops: stopOfferIds.join(","),
      startsOn,
    });

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/packages/${packageId}/checkout?${params}`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent) {
      await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      if (paymentIntent.status === "succeeded") {
        router.push(
          `/packages/${packageId}/checkout?success=1&party=${partySize}&startsOn=${startsOn}`,
        );
        router.refresh();
        return;
      }
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {loading ? "Processing…" : vibeCopy.bookMyVibe}
      </button>
    </form>
  );
}

type Props = {
  packageId: string;
  packageName: string;
  publishableKey: string;
  partySize: number;
  partySizeMin: number;
  partySizeMax: number;
  stopOfferIds: string[];
  startsOn: string;
  hidePartySelect?: boolean;
};

export function NightPackageCheckoutForm({
  packageId,
  publishableKey,
  partySize: initialPartySize,
  partySizeMin,
  partySizeMax,
  stopOfferIds,
  startsOn,
  hidePartySelect = false,
}: Props) {
  const [partySize, setPartySize] = useState(initialPartySize);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<{
    amount: number;
    subtotal: number;
    serviceFee: number;
    commissionPct: number;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  const money = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

  useEffect(() => {
    let cancelled = false;
    setLoadingIntent(true);
    setClientSecret(null);
    setLoadError(null);
    (async () => {
      const res = await fetch("/api/checkout/night-package/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, partySize, stopOfferIds, startsOn }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setLoadError(data.error ?? "Could not start checkout");
        setLoadingIntent(false);
        return;
      }
      setClientSecret(data.clientSecret);
      setBreakdown({
        amount: Number(data.amount ?? 0),
        subtotal: Number(data.subtotal ?? data.amount ?? 0),
        serviceFee: Number(data.serviceFee ?? 0),
        commissionPct: Number(data.commissionPct ?? 0),
      });
      setLoadingIntent(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [packageId, partySize, startsOn, stopOfferIds.join(",")]);

  const stripePromise = loadStripe(publishableKey);

  return (
    <div className="space-y-6">
      {!hidePartySelect && (
        <label className="block text-sm">
          <span className="font-medium">Party size</span>
          <select
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
          >
            {Array.from(
              { length: partySizeMax - partySizeMin + 1 },
              (_, i) => partySizeMin + i,
            ).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </label>
      )}

      {breakdown && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-wtva-muted">Subtotal</span>
            <span className="font-semibold tabular-nums">
              {money(breakdown.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-wtva-muted">Fees</span>
            <span className="font-semibold tabular-nums">
              {money(breakdown.serviceFee)}
            </span>
          </div>
          <div className="flex justify-between border-t border-wtva-dark-300 pt-2 text-base">
            <span className="font-bold">Total</span>
            <span className="font-bold tabular-nums">{money(breakdown.amount)}</span>
          </div>
        </div>
      )}

      {loadError && <p className="text-sm text-red-400">{loadError}</p>}
      {loadingIntent && <p className="text-sm text-wtva-muted">Preparing checkout…</p>}

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm
            packageId={packageId}
            partySize={partySize}
            stopOfferIds={stopOfferIds}
            startsOn={startsOn}
          />
        </Elements>
      )}
    </div>
  );
}

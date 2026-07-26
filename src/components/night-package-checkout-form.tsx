"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { buttonClass } from "@/lib/button";
import { vibeCopy } from "@/lib/vibe-copy";
import { VibeSplitCheckout } from "@/components/vibe-split-checkout";
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
  existingOrderId,
}: {
  packageId: string;
  partySize: number;
  stopOfferIds: string[];
  startsOn: string;
  existingOrderId?: string | null;
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
    if (existingOrderId) params.set("orderId", existingOrderId);

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
      const confirmRes = await fetch("/api/checkout/night-package/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      const confirmData = (await confirmRes.json().catch(() => ({}))) as {
        status?: string;
        error?: string;
      };
      if (paymentIntent.status === "succeeded") {
        if (!confirmRes.ok || confirmData.status !== "confirmed") {
          setError(
            confirmData.error ??
              "Payment succeeded, but confirming your plan failed. Check My Plans.",
          );
          setLoading(false);
          return;
        }
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

type ConnectGap = { venueId: string; venueName: string };

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
  estimatedTotal?: number;
  /** Pay an already-confirmed request-to-book order */
  existingOrderId?: string | null;
  /** Force request mode (e.g. known Connect gaps from server) */
  initialConnectGaps?: ConnectGap[] | null;
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
  estimatedTotal,
  existingOrderId = null,
  initialConnectGaps = null,
}: Props) {
  const router = useRouter();
  const [partySize, setPartySize] = useState(initialPartySize);
  const [payMode, setPayMode] = useState<"solo" | "split">("solo");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<{
    amount: number;
    subtotal: number;
    serviceFee: number;
    commissionPct: number;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connectGaps, setConnectGaps] = useState<ConnectGap[] | null>(
    initialConnectGaps,
  );
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestDone, setRequestDone] = useState<{
    expiresAt: string;
    confirmationCode: string;
  } | null>(null);

  const money = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

  const needsRequest = Boolean(connectGaps?.length) && !existingOrderId;

  useEffect(() => {
    if (payMode !== "solo" || needsRequest || requestDone) {
      setClientSecret(null);
      setLoadingIntent(false);
      return;
    }
    let cancelled = false;
    setLoadingIntent(true);
    setClientSecret(null);
    setLoadError(null);
    (async () => {
      const res = await fetch("/api/checkout/night-package/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          partySize,
          stopOfferIds,
          startsOn,
          orderId: existingOrderId || undefined,
        }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        if (
          !existingOrderId &&
          Array.isArray(data.venuesNeedingConnect) &&
          data.venuesNeedingConnect.length
        ) {
          setConnectGaps(data.venuesNeedingConnect as ConnectGap[]);
          setLoadError(null);
        } else {
          setConnectGaps(null);
          setLoadError(
            data.error ??
              (existingOrderId
                ? "Venues still need payout setup before you can pay. Try again soon."
                : "Could not start checkout"),
          );
        }
        setLoadingIntent(false);
        return;
      }
      setConnectGaps(null);
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
  }, [
    packageId,
    partySize,
    startsOn,
    stopOfferIds.join(","),
    payMode,
    needsRequest,
    requestDone,
    existingOrderId,
  ]);

  async function submitRequest() {
    setRequesting(true);
    setLoadError(null);
    const res = await fetch("/api/checkout/night-package/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, partySize, stopOfferIds, startsOn }),
    });
    const data = await res.json().catch(() => ({}));
    setRequesting(false);
    if (!res.ok) {
      setLoadError(data.error ?? "Could not send booking request");
      return;
    }
    setRequestDone({
      expiresAt: data.expiresAt as string,
      confirmationCode: data.confirmationCode as string,
    });
    router.refresh();
  }

  const stripePromise = loadStripe(publishableKey);

  if (requestDone) {
    return (
      <div className="space-y-3 rounded-xl border border-wtva-dark-300 bg-wtva-dark-400/40 p-4 text-sm">
        <p className="font-semibold text-foreground">Request sent</p>
        <p className="text-wtva-muted">
          Venues have 48 hours to confirm. Guest details stay private until everyone
          accepts — then you&apos;ll pay the full total.
        </p>
        <p className="text-wtva-muted">
          Ref <span className="font-mono font-semibold text-foreground">{requestDone.confirmationCode}</span>
          {requestDone.expiresAt
            ? ` · expires ${new Date(requestDone.expiresAt).toLocaleString()}`
            : ""}
        </p>
        <button
          type="button"
          className={buttonClass("secondary", "md", "mt-2")}
          onClick={() => router.push("/packages/orders")}
        >
          View My Plans
        </button>
      </div>
    );
  }

  if (needsRequest) {
    const names = (connectGaps ?? []).map((g) => g.venueName).filter(Boolean);
    return (
      <div className="space-y-4">
        {estimatedTotal != null && (
          <p className="text-sm text-wtva-muted">
            Estimated total{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {money(estimatedTotal)}
            </span>{" "}
            after venues confirm.
          </p>
        )}
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-dark-400/40 px-4 py-3 text-sm text-wtva-muted">
          <p className="font-semibold text-foreground">Request to book</p>
          <p className="mt-1">
            Some places still need payout setup before instant checkout
            {names.length ? `: ${names.join(", ")}` : ""}. Send a request — venues
            confirm first (without seeing your contact info). You&apos;ll pay the full
            total once everyone accepts.
          </p>
        </div>
        {loadError && <p className="text-sm text-red-400">{loadError}</p>}
        <button
          type="button"
          disabled={requesting}
          onClick={submitRequest}
          className={buttonClass("primary", "lg", "w-full")}
        >
          {requesting ? "Sending request…" : "Request to book"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!existingOrderId && (
        <div className="inline-flex gap-1 rounded-full border border-wtva-dark-300 bg-wtva-dark-400 p-1">
          <button
            type="button"
            onClick={() => setPayMode("solo")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              payMode === "solo"
                ? "bg-accent-gradient text-white shadow-accent"
                : "text-wtva-muted"
            }`}
          >
            Pay myself
          </button>
          <button
            type="button"
            onClick={() => setPayMode("split")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              payMode === "split"
                ? "bg-accent-gradient text-white shadow-accent"
                : "text-wtva-muted"
            }`}
          >
            Split with friends
          </button>
        </div>
      )}

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

      {payMode === "split" && !existingOrderId ? (
        <VibeSplitCheckout
          packageId={packageId}
          publishableKey={publishableKey}
          partySize={partySize}
          stopOfferIds={stopOfferIds}
          startsOn={startsOn}
          estimatedTotal={breakdown?.amount ?? estimatedTotal}
        />
      ) : (
        <>
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
                <span className="font-bold tabular-nums">
                  {money(breakdown.amount)}
                </span>
              </div>
            </div>
          )}

          {loadError && <p className="text-sm text-red-400">{loadError}</p>}
          {loadingIntent && (
            <p className="text-sm text-wtva-muted">Preparing checkout…</p>
          )}

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                packageId={packageId}
                partySize={partySize}
                stopOfferIds={stopOfferIds}
                startsOn={startsOn}
                existingOrderId={existingOrderId}
              />
            </Elements>
          )}
        </>
      )}
    </div>
  );
}

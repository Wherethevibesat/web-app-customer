"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

function CheckoutForm({
  packageId,
  packageName,
}: {
  packageId: string;
  packageName: string;
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

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/${packageId}?done=1`,
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
        router.push(`/checkout/${packageId}?success=1`);
        router.refresh();
        return;
      }
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-wtva-muted">
        Completing purchase for <strong className="text-foreground">{packageName}</strong>
      </p>
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}

type Props = {
  packageId: string;
  packageName: string;
  publishableKey: string;
};

export function VipCheckoutForm({ packageId, packageName, publishableKey }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setLoadError(data.error ?? "Could not start checkout");
        return;
      }
      setClientSecret(data.clientSecret);
      setAmount(data.amount);
    })();
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  if (loadError) {
    return (
      <p className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
        {loadError}
      </p>
    );
  }

  if (!clientSecret) {
    return <p className="text-sm text-wtva-muted">Preparing secure checkout…</p>;
  }

  const stripePromise = loadStripe(publishableKey);

  return (
    <div>
      {amount != null && (
        <p className="mb-6 text-2xl font-bold">
          ${Number(amount).toFixed(2)}
        </p>
      )}
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm packageId={packageId} packageName={packageName} />
      </Elements>
    </div>
  );
}

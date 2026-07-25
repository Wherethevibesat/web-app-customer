"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { buttonClass } from "@/lib/button";
import type { MobilePayKind } from "@/lib/stripe/mobile-pay-token";

function PayForm({
  paymentIntentId,
  amountLabel,
}: {
  paymentIntentId: string;
  amountLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/pay/mobile/done`,
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    const piId = paymentIntent?.id ?? paymentIntentId;
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      setDone(true);
      setLoading(false);
      window.location.href = `wherethevibesat://pay-complete?pi=${encodeURIComponent(piId)}&ok=1`;
      return;
    }

    setError("Payment incomplete. Try again or use another method.");
    setLoading(false);
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-lg font-bold text-foreground">You&apos;re paid</p>
        <p className="text-sm text-wtva-muted">
          Return to the app to finish booking.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {loading ? "Processing…" : `Pay ${amountLabel}`}
      </button>
    </form>
  );
}

export function MobilePayCheckout({
  publishableKey,
  clientSecret,
  paymentIntentId,
  kind: _kind,
  amountLabel,
}: {
  publishableKey: string;
  clientSecret: string;
  paymentIntentId: string;
  kind: MobilePayKind;
  amountLabel: string;
}) {
  const stripePromise = loadStripe(publishableKey);

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment</h1>
        <p className="mt-1 text-sm text-wtva-muted">Total {amountLabel}</p>
      </div>
      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-4 md:p-5">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: { colorPrimary: "#a855f7" },
            },
          }}
        >
          <PayForm paymentIntentId={paymentIntentId} amountLabel={amountLabel} />
        </Elements>
      </div>
    </div>
  );
}

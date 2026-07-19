"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { buttonClass } from "@/lib/button";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { EventTicketTier } from "@/lib/data/event-tickets";

function formatPrice(cents: number) {
  if (cents <= 0) return "Free";
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function PaidCheckout({
  eventId,
  tier,
  publishableKey,
  onClose,
}: {
  eventId: string;
  tier: EventTicketTier;
  publishableKey: string;
  onClose: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripePromise = loadStripe(publishableKey);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/checkout/event-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierId: tier.id, eventId }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Could not start checkout");
      return;
    }
    setClientSecret(body.clientSecret);
  }

  if (!clientSecret) {
    return (
      <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 space-y-3">
        <p className="font-semibold">{tier.name}</p>
        <p className="text-lg font-bold">{formatPrice(tier.price_cents)}</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className={buttonClass("primary", "md", "w-full")}
        >
          {loading ? "Loading…" : "Continue to payment"}
        </button>
        <button type="button" onClick={onClose} className="text-sm text-wtva-muted hover:text-foreground">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaidCheckoutForm eventId={eventId} tier={tier} onClose={onClose} />
    </Elements>
  );
}

function PaidCheckoutForm({
  eventId,
  tier,
  onClose,
}: {
  eventId: string;
  tier: EventTicketTier;
  onClose: () => void;
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
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      await fetch("/api/checkout/event-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      router.refresh();
      onClose();
      return;
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 space-y-4">
      <p className="font-semibold">{tier.name} · {formatPrice(tier.price_cents)}</p>
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className={buttonClass("primary", "md", "w-full")}
      >
        {loading ? "Processing…" : "Pay & register"}
      </button>
      <button type="button" onClick={onClose} className="text-sm text-wtva-muted">
        Cancel
      </button>
    </form>
  );
}

type Props = {
  eventId: string;
  tiers: EventTicketTier[];
  publishableKey: string | null;
  isSignedIn: boolean;
  existingRegistration?: { tierName: string } | null;
};

export function EventTicketsSection({
  eventId,
  tiers,
  publishableKey,
  isSignedIn,
  existingRegistration,
}: Props) {
  const router = useRouter();
  const [payingTier, setPayingTier] = useState<EventTicketTier | null>(null);
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (tiers.length === 0) return null;

  if (existingRegistration) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-bold">Your RSVP</h2>
        <p className="mt-2 text-wtva-muted">
          You&apos;re registered ({existingRegistration.tierName}).
        </p>
      </section>
    );
  }

  async function freeRsvp(tierId: string) {
    if (!isSignedIn) {
      router.push(`/auth/login?next=/events/${eventId}`);
      return;
    }
    setLoadingTierId(tierId);
    setMessage(null);
    const res = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierId }),
    });
    const body = await res.json().catch(() => ({}));
    setLoadingTierId(null);
    if (!res.ok) {
      setMessage(body.error ?? "Registration failed");
      return;
    }
    router.refresh();
  }

  function selectTier(tier: EventTicketTier) {
    if (!isSignedIn) {
      router.push(`/auth/login?next=/events/${eventId}`);
      return;
    }
    if (tier.price_cents <= 0) {
      void freeRsvp(tier.id);
      return;
    }
    if (!publishableKey) {
      setMessage("Online ticket sales are not available yet.");
      return;
    }
    setPayingTier(tier);
  }

  if (payingTier && publishableKey) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">Tickets & RSVP</h2>
        <PaidCheckout
          eventId={eventId}
          tier={payingTier}
          publishableKey={publishableKey}
          onClose={() => setPayingTier(null)}
        />
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold">Tickets & RSVP</h2>
      <p className="mt-1 text-sm text-wtva-muted">Free RSVP is always available when listed.</p>
      {message && <p className="mt-2 text-sm text-red-400">{message}</p>}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {tiers.map((tier) => (
          <li
            key={tier.id}
            className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 flex flex-col"
          >
            <p className="font-semibold">{tier.name}</p>
            <p className="mt-1 text-lg font-bold">{formatPrice(tier.price_cents)}</p>
            {tier.description && (
              <p className="mt-2 text-sm text-wtva-muted flex-1">{tier.description}</p>
            )}
            <button
              type="button"
              onClick={() => selectTier(tier)}
              disabled={loadingTierId === tier.id}
              className={buttonClass("primary", "md", "mt-4 w-full")}
            >
              {loadingTierId === tier.id
                ? "…"
                : tier.price_cents <= 0
                  ? "Free RSVP"
                  : "Get ticket"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

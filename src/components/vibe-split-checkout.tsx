"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { buttonClass } from "@/lib/button";
import { vibeCopy } from "@/lib/vibe-copy";

function SharePayForm({
  onPaid,
}: {
  onPaid: (result: { status: string; groupId: string }) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
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
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (!paymentIntent?.id) {
      setError("Payment incomplete");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/checkout/night-package/group/confirm-share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
    });
    const data = await res.json();
    if (!res.ok && data.status !== "pending") {
      setError(data.error ?? "Could not confirm share");
      setLoading(false);
      return;
    }
    onPaid({ status: data.status, groupId: data.groupId });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {loading ? "Processing…" : "Pay my share"}
      </button>
    </form>
  );
}

export function VibeSplitCheckout({
  packageId,
  publishableKey,
  partySize,
  stopOfferIds,
  startsOn,
}: {
  packageId: string;
  publishableKey: string;
  partySize: number;
  stopOfferIds: string[];
  startsOn: string;
}) {
  const router = useRouter();
  const [payerCount, setPayerCount] = useState(2);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<{
    groupId: string;
    inviteUrl: string;
    hostShareId: string;
    amounts: number[];
    total: number;
  } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [done, setDone] = useState<"waiting" | "booked" | null>(null);

  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );

  const money = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(n);

  async function createGroup() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/night-package/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          partySize,
          stopOfferIds,
          startsOn,
          payerCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create split");
        return;
      }
      setGroup({
        groupId: data.groupId,
        inviteUrl: data.inviteUrl,
        hostShareId: data.hostShareId,
        amounts: data.amounts,
        total: data.total,
      });

      const payRes = await fetch("/api/checkout/night-package/group/pay-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: data.groupId,
          shareId: data.hostShareId,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(payData.error ?? "Could not start host payment");
        return;
      }
      setClientSecret(payData.clientSecret);
    } finally {
      setCreating(false);
    }
  }

  if (done === "booked") {
    return (
      <div className="space-y-3 text-center">
        <p className="font-bold">{vibeCopy.bookedTitle}</p>
        <p className="text-sm text-wtva-muted">
          Everyone paid — your vibe is confirmed.
        </p>
        <button
          type="button"
          className={buttonClass("primary", "md", "w-full")}
          onClick={() => router.push("/packages/orders")}
        >
          View {vibeCopy.myPlans}
        </button>
      </div>
    );
  }

  if (done === "waiting" && group) {
    return (
      <div className="space-y-4">
        <p className="font-bold">Your share is paid</p>
        <p className="text-sm text-wtva-muted">
          Share this link with friends. The vibe books when everyone pays.
        </p>
        <input
          readOnly
          value={group.inviteUrl}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className={buttonClass("secondary", "md", "w-full")}
          onClick={() => navigator.clipboard.writeText(group.inviteUrl)}
        >
          Copy invite link
        </button>
        <button
          type="button"
          className={buttonClass("primary", "md", "w-full")}
          onClick={() =>
            router.push(
              `/packages/split/${group.inviteUrl.split("/").pop()}`,
            )
          }
        >
          Open waiting room
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!group && (
        <>
          <label className="block text-sm">
            <span className="font-medium">How many people are splitting?</span>
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
          <p className="text-sm text-wtva-muted">
            Total is split evenly. The vibe is only booked when every share is
            paid (invite expires in 24 hours).
          </p>
          <button
            type="button"
            disabled={creating}
            onClick={createGroup}
            className={buttonClass("primary", "lg", "w-full")}
          >
            {creating ? "Creating…" : "Create split & pay my share"}
          </button>
        </>
      )}

      {group && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-wtva-muted">Group total</span>
            <span className="font-semibold">{money(group.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-wtva-muted">Your share</span>
            <span className="font-semibold">{money(group.amounts[0] ?? 0)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SharePayForm
            onPaid={(result) => {
              if (result.status === "group_paid") {
                setDone("booked");
              } else {
                setDone("waiting");
              }
            }}
          />
        </Elements>
      )}
    </div>
  );
}

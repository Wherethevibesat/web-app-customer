"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type Share = {
  id: string;
  role: string;
  amount: number;
  status: string;
  userId: string | null;
  label: string | null;
  email?: string | null;
};

type GroupState = {
  id: string;
  status: string;
  total: number;
  expiresAt: string;
  hostUserId: string;
  shares: Share[];
};

function PayShareForm({ onDone }: { onDone: () => void }) {
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
      confirmParams: { return_url: window.location.href },
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
      setError(data.error ?? "Could not confirm");
      setLoading(false);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

export function VibeSplitWaitingRoom({
  token,
  publishableKey,
  userId,
  userEmail,
  preferredShareId,
  inviteUrl,
  initial,
}: {
  token: string;
  publishableKey: string;
  userId: string;
  userEmail?: string | null;
  preferredShareId?: string | null;
  inviteUrl?: string | null;
  initial: GroupState;
}) {
  const router = useRouter();
  const [group, setGroup] = useState(initial);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );

  const money = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(n);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/checkout/night-package/group/${token}`);
    if (!res.ok) return;
    const data = await res.json();
    setGroup({
      id: data.id,
      status: data.status,
      total: data.total,
      expiresAt: data.expiresAt,
      hostUserId: data.hostUserId,
      shares: data.shares,
    });
  }, [token]);

  useEffect(() => {
    if (group.status === "paid") return;
    const id = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [group.status, refresh]);

  const email = userEmail?.trim().toLowerCase() ?? null;
  const isHost = group.hostUserId === userId;

  const myShare =
    (preferredShareId
      ? group.shares.find((s) => s.id === preferredShareId)
      : null) ??
    group.shares.find((s) => s.userId === userId) ??
    (isHost
      ? group.shares.find((s) => s.role === "host")
      : null) ??
    (email
      ? group.shares.find(
          (s) =>
            s.role === "guest" &&
            s.status === "pending" &&
            s.email?.toLowerCase() === email,
        )
      : null) ??
    group.shares.find(
      (s) => s.role === "guest" && s.status === "pending" && !s.userId,
    ) ??
    null;

  const iPaid =
    myShare?.status === "paid" ||
    group.shares.some((s) => s.userId === userId && s.status === "paid");

  async function startPay() {
    if (!myShare || myShare.status === "paid") return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/night-package/group/pay-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, shareId: myShare.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start payment");
        return;
      }
      setClientSecret(data.clientSecret);
    } finally {
      setStarting(false);
    }
  }

  if (group.status === "paid") {
    return (
      <div className="space-y-3 text-center">
        <p className="text-lg font-bold">{vibeCopy.bookedTitle}</p>
        <p className="text-sm text-wtva-muted">All shares paid — you&apos;re booked.</p>
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

  if (group.status === "expired" || group.status === "cancelled") {
    return (
      <div className="space-y-2 text-sm text-wtva-muted">
        <p>This split is {group.status}.</p>
        <p>
          Unpaid shares are closed. Any share already paid is not auto-refunded —
          contact support if you need help.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isHost && inviteUrl && (
        <div className="space-y-2 rounded-xl border border-wtva-dark-300 bg-wtva-dark-400/40 p-4">
          <p className="text-sm font-semibold">Payment requests sent</p>
          <p className="text-xs text-wtva-muted">
            Friends got an email with their pay link. You can also share this
            waiting-room link:
          </p>
          <input
            readOnly
            value={inviteUrl}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-xs"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            className={buttonClass("secondary", "sm", "w-full")}
            onClick={async () => {
              await navigator.clipboard.writeText(inviteUrl);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy invite link"}
          </button>
        </div>
      )}

      <ul className="divide-y divide-wtva-dark-300 rounded-xl border border-wtva-dark-300">
        {group.shares.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="min-w-0 truncate">
              {s.label ?? s.role}
              {s.id === myShare?.id ? " (you)" : ""}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {money(s.amount)} · {s.status}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-wtva-muted">
        Expires {new Date(group.expiresAt).toLocaleString()} · Total{" "}
        {money(group.total)}
      </p>

      {iPaid ? (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
          You&apos;re paid — waiting on friends.
        </p>
      ) : myShare ? (
        <>
          {!clientSecret && (
            <button
              type="button"
              disabled={starting}
              onClick={startPay}
              className={buttonClass("primary", "lg", "w-full")}
            >
              {starting ? "Preparing…" : `Pay ${money(myShare.amount)}`}
            </button>
          )}
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PayShareForm
                onDone={() => {
                  setClientSecret(null);
                  void refresh();
                }}
              />
            </Elements>
          )}
        </>
      ) : (
        <p className="text-sm text-wtva-muted">No open shares left to claim.</p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

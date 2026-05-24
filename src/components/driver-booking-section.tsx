"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { DriverPackage } from "@/lib/data/drivers";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

type BookingForm = {
  pickupAddress: string;
  dropoffAddress: string;
  scheduledStartsAt: string;
  customerNotes: string;
};

function PaidDriverCheckout({
  companyId,
  pkg,
  form,
  publishableKey,
  onClose,
}: {
  companyId: string;
  pkg: DriverPackage;
  form: BookingForm;
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
    const res = await fetch("/api/checkout/driver-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: pkg.id,
        pickupAddress: form.pickupAddress,
        dropoffAddress: form.dropoffAddress,
        scheduledStartsAt: form.scheduledStartsAt,
        customerNotes: form.customerNotes,
      }),
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
        <p className="font-semibold">
          {pkg.vehicle_name} · {pkg.label || `${pkg.duration_hours}h`}
        </p>
        <p className="text-lg font-bold">{formatPrice(pkg.price_cents)}</p>
        <p className="text-sm text-wtva-muted">Pickup: {form.pickupAddress}</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background disabled:opacity-50"
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
      <PaidDriverCheckoutForm companyId={companyId} pkg={pkg} onClose={onClose} />
    </Elements>
  );
}

function PaidDriverCheckoutForm({
  companyId,
  pkg,
  onClose,
}: {
  companyId: string;
  pkg: DriverPackage;
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
      await fetch("/api/checkout/driver-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      router.push(`/drivers/${companyId}?booked=1`);
      router.refresh();
      onClose();
      return;
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 space-y-4">
      <p className="font-semibold">
        {pkg.vehicle_name} · {formatPrice(pkg.price_cents)}
      </p>
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Processing…" : "Pay & request booking"}
      </button>
      <button type="button" onClick={onClose} className="text-sm text-wtva-muted">
        Cancel
      </button>
    </form>
  );
}

type Props = {
  companyId: string;
  packages: DriverPackage[];
  publishableKey: string | null;
  isSignedIn: boolean;
};

export function DriverBookingSection({
  companyId,
  packages,
  publishableKey,
  isSignedIn,
}: Props) {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<DriverPackage | null>(null);
  const [form, setForm] = useState<BookingForm>({
    pickupAddress: "",
    dropoffAddress: "",
    scheduledStartsAt: "",
    customerNotes: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  if (packages.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-bold">Book a ride</h2>
        <p className="mt-2 text-sm text-wtva-muted">No packages listed yet.</p>
      </section>
    );
  }

  function beginCheckout(pkg: DriverPackage) {
    if (!isSignedIn) {
      router.push(`/auth/login?next=/drivers/${companyId}`);
      return;
    }
    if (!form.pickupAddress.trim()) {
      setMessage("Pickup address is required.");
      return;
    }
    if (!form.scheduledStartsAt) {
      setMessage("Choose a date and time for pickup.");
      return;
    }
    if (!publishableKey) {
      setMessage("Online booking is not available yet.");
      return;
    }
    setMessage(null);
    setSelectedPackage(pkg);
    setPaying(true);
  }

  if (paying && selectedPackage && publishableKey) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">Complete booking</h2>
        <PaidDriverCheckout
          companyId={companyId}
          pkg={selectedPackage}
          form={form}
          publishableKey={publishableKey}
          onClose={() => {
            setPaying(false);
            setSelectedPackage(null);
          }}
        />
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold">Book a ride</h2>
      <p className="mt-1 text-sm text-wtva-muted">
        Choose a package, enter pickup details, and pay. The driver must accept your request.
      </p>

      <div className="mt-6 grid gap-4 rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Pickup address *</label>
          <input
            required
            value={form.pickupAddress}
            onChange={(e) => setForm((f) => ({ ...f, pickupAddress: e.target.value }))}
            placeholder="Street, building, or hotel"
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Dropoff (optional)</label>
          <input
            value={form.dropoffAddress}
            onChange={(e) => setForm((f) => ({ ...f, dropoffAddress: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Pickup date & time *</label>
          <input
            type="datetime-local"
            required
            value={form.scheduledStartsAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledStartsAt: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Notes (optional)</label>
          <input
            value={form.customerNotes}
            onChange={(e) => setForm((f) => ({ ...f, customerNotes: e.target.value }))}
            placeholder="Party size, special requests"
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm"
          />
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-red-400">{message}</p>}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {packages.map((pkg) => (
          <li
            key={pkg.id}
            className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 flex flex-col"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-wtva-muted">
              {pkg.vehicle_name}
            </p>
            <p className="mt-1 font-semibold">
              {pkg.label || `${pkg.duration_hours} hour${pkg.duration_hours === 1 ? "" : "s"}`}
            </p>
            <p className="mt-1 text-lg font-bold">{formatPrice(pkg.price_cents)}</p>
            {pkg.description && (
              <p className="mt-2 text-sm text-wtva-muted flex-1">{pkg.description}</p>
            )}
            <button
              type="button"
              onClick={() => beginCheckout(pkg)}
              className="mt-4 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
            >
              Request booking
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

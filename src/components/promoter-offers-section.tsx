"use client";

import { useState } from "react";
import Link from "next/link";
import type { PromoterOfferPublic } from "@/lib/data/promoters";
import { promoterPublicPath } from "@/lib/promoter-slug";
import { buttonClass } from "@/lib/button";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function PromoterOffersSection({
  eventId,
  offers,
  isSignedIn,
}: {
  eventId: string;
  offers: PromoterOfferPublic[];
  isSignedIn: boolean;
}) {
  const [activeOffer, setActiveOffer] = useState<PromoterOfferPublic | null>(null);
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    partySize: "",
    arrivalTime: "",
    notes: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (offers.length === 0) return null;

  async function submitInquiry() {
    if (!activeOffer) return;
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/promoter/inquire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId: activeOffer.id,
        ...form,
        partySize: form.partySize ? Number(form.partySize) : null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(body.error ?? "Could not submit inquiry");
      return;
    }
    setDone(true);
    setActiveOffer(null);
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold">Tables & VIP from promoters</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {offers.map((o) => (
          <li
            key={o.id}
            className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 flex flex-col"
          >
            <p className="font-semibold">{o.name}</p>
            {o.promoter?.display_name && (
              <Link
                href={promoterPublicPath({ user_id: o.promoter_id, slug: null })}
                className="text-xs text-wtva-muted hover:underline"
              >
                by {o.promoter.display_name}
              </Link>
            )}
            <p className="mt-1 text-lg font-bold">{formatPrice(o.price_cents)}</p>
            <p className="text-xs text-wtva-muted">
              {o.capacity - o.slots_used} of {o.capacity} available
            </p>
            {o.description && (
              <p className="mt-2 text-sm text-wtva-muted flex-1">{o.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {o.allow_inquire && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveOffer(o);
                    setDone(false);
                    setMessage(null);
                  }}
                  className={buttonClass("primary", "sm")}
                >
                  Request to book
                </button>
              )}
              {o.allow_pay && (
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm text-wtva-muted"
                  title="Online payment coming soon"
                >
                  Pay online (soon)
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {done && (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Inquiry sent. The promoter will contact you to confirm.
        </p>
      )}

      {activeOffer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-wtva-dark-300 bg-wtva-card p-6">
            <h3 className="font-bold">Request: {activeOffer.name}</h3>
            <p className="text-sm text-wtva-muted">{formatPrice(activeOffer.price_cents)}</p>
            {!isSignedIn && (
              <p className="mt-2 text-sm text-amber-200">
                <Link href={`/auth/login?next=/events/${eventId}`} className="underline">
                  Sign in
                </Link>{" "}
                optional — we will use the contact info below.
              </p>
            )}
            <div className="mt-4 space-y-3">
              <input
                required
                placeholder="Your name *"
                value={form.guestName}
                onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email *"
                value={form.guestEmail}
                onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))}
                className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
              />
              <input
                placeholder="Phone"
                value={form.guestPhone}
                onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))}
                className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                placeholder="Party size"
                value={form.partySize}
                onChange={(e) => setForm((f) => ({ ...f, partySize: e.target.value }))}
                className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
              />
              <input
                placeholder="Preferred arrival time"
                value={form.arrivalTime}
                onChange={(e) => setForm((f) => ({ ...f, arrivalTime: e.target.value }))}
                className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
              />
            </div>
            {message && <p className="mt-2 text-sm text-red-400">{message}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={submitInquiry}
                className={buttonClass("primary", "md", "flex-1")}
              >
                {loading ? "Sending…" : "Send inquiry"}
              </button>
              <button
                type="button"
                onClick={() => setActiveOffer(null)}
                className={buttonClass("secondary", "sm")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { VenuePromoterOffer } from "@/lib/data/promoters";
import { promoterPublicPath } from "@/lib/promoter-slug";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function VenueTablesSection({
  venueId,
  offers,
  isSignedIn,
}: {
  venueId: string;
  offers: VenuePromoterOffer[];
  isSignedIn: boolean;
}) {
  const [activeOffer, setActiveOffer] = useState<VenuePromoterOffer | null>(null);
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
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="flex flex-col rounded-xl border border-wtva-dark-300 bg-wtva-card p-5"
          >
            <p className="font-semibold">{offer.name}</p>
            <Link
              href={`/events/${offer.event_id}`}
              className="text-xs text-wtva-muted hover:underline"
            >
              {offer.event_title}
            </Link>
            {offer.promoter?.display_name && (
              <Link
                href={promoterPublicPath({
                  user_id: offer.promoter_id,
                  slug: offer.promoter.slug ?? null,
                })}
                className="mt-1 text-xs text-wtva-muted hover:underline"
              >
                by {offer.promoter.display_name}
              </Link>
            )}
            <p className="mt-2 text-lg font-bold">{formatPrice(offer.price_cents)}</p>
            <p className="text-xs text-wtva-muted">
              {offer.capacity - offer.slots_used} of {offer.capacity} available
            </p>
            {offer.description && (
              <p className="mt-2 flex-1 text-sm text-wtva-muted">{offer.description}</p>
            )}
            {offer.allow_inquire && (
              <button
                type="button"
                onClick={() => {
                  setActiveOffer(offer);
                  setDone(false);
                  setMessage(null);
                }}
                className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                Request to book
              </button>
            )}
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
            <p className="text-sm text-wtva-muted">{activeOffer.event_title}</p>
            <p className="text-sm text-wtva-muted">{formatPrice(activeOffer.price_cents)}</p>
            {!isSignedIn && (
              <p className="mt-2 text-sm text-amber-200">
                <Link href={`/auth/login?next=/venues/${venueId}`} className="underline">
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
                className="flex-1 rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send inquiry"}
              </button>
              <button
                type="button"
                onClick={() => setActiveOffer(null)}
                className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm"
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

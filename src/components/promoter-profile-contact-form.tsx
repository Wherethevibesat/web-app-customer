"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/lib/button";

export function PromoterProfileContactForm({
  promoterId,
  promoterName,
  isSignedIn,
}: {
  promoterId: string;
  promoterName: string;
  isSignedIn: boolean;
}) {
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    partySize: "",
    preferredEvent: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/promoter/profile-inquire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promoterId,
        ...form,
        partySize: form.partySize ? Number(form.partySize) : null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMessage(body.error ?? "Could not send message");
      return;
    }

    setDone(true);
    setForm({
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      partySize: "",
      preferredEvent: "",
      notes: "",
    });
  }

  if (done) {
    return (
      <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        Message sent. {promoterName} will follow up by email.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!isSignedIn && (
        <p className="text-sm text-wtva-muted">
          <Link href="/auth/login" className="underline">
            Sign in
          </Link>{" "}
          optional — we will use the contact info below.
        </p>
      )}
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
        placeholder="Event or night you are interested in"
        value={form.preferredEvent}
        onChange={(e) => setForm((f) => ({ ...f, preferredEvent: e.target.value }))}
        className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Message"
        rows={4}
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
      />
      {message && <p className="text-sm text-red-400">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

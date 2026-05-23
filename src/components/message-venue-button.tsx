"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

type Props = {
  venueId: string;
  venueName: string;
  signedIn: boolean;
};

export function MessageVenueButton({ venueId, venueName, signedIn }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!signedIn) {
    return (
      <a
        href={`/auth/login?next=/venues/${venueId}`}
        className="inline-flex items-center gap-2 rounded-lg border border-wtva-dark-300 px-6 py-3 text-sm font-semibold hover:border-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        Message venue
      </a>
    );
  }

  async function openThread() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, venueName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/messages/${data.threadId}`);
    } catch {
      alert("Could not open venue chat. Ensure messaging migration 006 is applied.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={openThread}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-wtva-dark-300 px-6 py-3 text-sm font-semibold hover:border-foreground disabled:opacity-50"
    >
      <MessageCircle className="h-4 w-4" />
      {loading ? "Opening…" : "Message venue"}
    </button>
  );
}

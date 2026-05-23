"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export function FavoriteButton({
  venueId,
  initialFavorited,
}: {
  venueId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId }),
    });
    setLoading(false);
    if (res.status === 401) {
      window.location.href = `/auth/login?next=/venues/${venueId}`;
      return;
    }
    if (res.ok) {
      const body = await res.json();
      setFavorited(body.favorited);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={toggle}
      className="rounded-lg border border-wtva-dark-300 p-2"
      aria-label="Favorite"
    >
      <Heart
        className={`h-5 w-5 ${favorited ? "fill-foreground text-foreground" : "text-wtva-muted"}`}
      />
    </button>
  );
}

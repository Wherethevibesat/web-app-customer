"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export function FavoriteButton({
  venueId,
  initialFavorited,
  variant = "icon",
}: {
  venueId: string;
  initialFavorited: boolean;
  variant?: "icon" | "labeled";
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
      className={
        variant === "labeled"
          ? "inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-wtva-dark-300 px-4 py-2.5 text-sm font-semibold text-foreground hover:border-accent hover:text-accent disabled:opacity-50"
          : "rounded-full border border-wtva-dark-300 p-2 disabled:opacity-50"
      }
      aria-label={variant === "labeled" ? undefined : "Favorite"}
    >
      <Heart
        className={`h-5 w-5 ${favorited ? "fill-accent text-accent" : "text-wtva-muted"}`}
      />
      {variant === "labeled" ? (favorited ? "Saved" : "Save venue") : null}
    </button>
  );
}

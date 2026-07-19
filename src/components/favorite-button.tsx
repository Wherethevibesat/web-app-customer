"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { buttonClass } from "@/lib/button";

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
          ? buttonClass("secondary", "md", "whitespace-nowrap px-4")
          : "inline-flex items-center justify-center rounded-full border border-wtva-dark-300 p-2 transition-colors hover:border-accent disabled:opacity-50"
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

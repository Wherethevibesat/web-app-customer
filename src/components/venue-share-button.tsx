"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function VenueShareButton({
  venueName,
  venuePath,
}: {
  venueName: string;
  venuePath: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${venuePath}`
        : venuePath;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: venueName, url });
        return;
      } catch {
        // fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-wtva-dark-300 px-4 py-2.5 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
    >
      <Share2 className="h-4 w-4" />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

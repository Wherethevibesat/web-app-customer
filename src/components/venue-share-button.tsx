"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { buttonClass } from "@/lib/button";

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
      className={buttonClass("secondary", "md", "whitespace-nowrap px-4")}
    >
      <Share2 className="h-4 w-4" />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

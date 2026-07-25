"use client";

import { useEffect } from "react";
import { saveVibeCheckoutDraft } from "@/lib/vibe-checkout-draft";

/** Keep checkout query state in sessionStorage while the pay step is open. */
export function VibeCheckoutDraftPersist({
  packageId,
  party,
  stops,
  startsOn,
}: {
  packageId: string;
  party: number;
  stops: string;
  startsOn: string;
}) {
  useEffect(() => {
    if (!packageId || !startsOn) return;
    saveVibeCheckoutDraft({ packageId, party, stops, startsOn });
  }, [packageId, party, stops, startsOn]);

  return null;
}

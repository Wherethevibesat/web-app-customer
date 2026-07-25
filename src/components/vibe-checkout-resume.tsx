"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  readVibeCheckoutDraft,
  vibeCheckoutHref,
} from "@/lib/vibe-checkout-draft";

/**
 * If checkout opened without plan query params (e.g. after a bare login),
 * restore the saved draft so the user can finish payment.
 */
export function VibeCheckoutResume({ packageId }: { packageId: string }) {
  const router = useRouter();

  useEffect(() => {
    const draft = readVibeCheckoutDraft();
    if (!draft || draft.packageId !== packageId) return;
    router.replace(vibeCheckoutHref(draft));
  }, [packageId, router]);

  return (
    <p className="text-sm text-wtva-muted">Restoring your vibe checkout…</p>
  );
}

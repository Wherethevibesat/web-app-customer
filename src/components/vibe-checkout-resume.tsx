"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  readVibeCheckoutDraft,
  vibeCheckoutHref,
} from "@/lib/vibe-checkout-draft";

/**
 * If checkout opened without plan query params (e.g. after a bare login),
 * restore the saved draft so the user can finish payment.
 * Falls back to Build if there is nothing to restore (never hang on this screen).
 */
export function VibeCheckoutResume({ packageId }: { packageId: string }) {
  const router = useRouter();
  const [stuck, setStuck] = useState(false);
  const planHref = `/packages/${packageId}/plan`;

  useEffect(() => {
    const draft = readVibeCheckoutDraft();
    if (!draft || draft.packageId !== packageId) {
      router.replace(planHref);
      return;
    }

    const href = vibeCheckoutHref(draft);
    const current = `${window.location.pathname}${window.location.search}`;
    // Already on the restored URL but server still rejected (e.g. bad date) — don't loop.
    if (current === href || new URLSearchParams(window.location.search).get("startsOn") === draft.startsOn) {
      setStuck(true);
      return;
    }

    router.replace(href);
  }, [packageId, planHref, router]);

  if (stuck) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-wtva-muted">
          Couldn&apos;t restore this checkout. Pick your date and experiences again.
        </p>
        <Link href={planHref} className="text-sm font-semibold text-accent underline">
          Back to build
        </Link>
      </div>
    );
  }

  return (
    <p className="text-sm text-wtva-muted">Restoring your vibe checkout…</p>
  );
}

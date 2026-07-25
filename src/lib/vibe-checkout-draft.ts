/** Persist vibe checkout path so login/register can return to the same pay step. */

export type VibeCheckoutDraft = {
  packageId: string;
  party: number;
  stops: string;
  startsOn: string;
  savedAt: number;
};

const KEY = "wtva_vibe_checkout_draft";

export function saveVibeCheckoutDraft(draft: Omit<VibeCheckoutDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: VibeCheckoutDraft = { ...draft, savedAt: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function readVibeCheckoutDraft(): VibeCheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as VibeCheckoutDraft;
    if (!data?.packageId || !data?.startsOn) return null;
    // 2 hours
    if (Date.now() - (data.savedAt ?? 0) > 2 * 60 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export function vibeCheckoutHref(draft: {
  packageId: string;
  party: number;
  stops: string;
  startsOn: string;
}) {
  const params = new URLSearchParams({
    party: String(draft.party),
    stops: draft.stops,
    startsOn: draft.startsOn,
  });
  return `/packages/${draft.packageId}/checkout?${params.toString()}`;
}

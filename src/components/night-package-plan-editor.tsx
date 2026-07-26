"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { buttonClass } from "@/lib/button";
import { formatPrice } from "@/lib/format";
import {
  nightPackageTotals,
  slotTypeLabel,
  type ApprovedStopOffer,
} from "@/lib/data/night-packages-shared";
import { toLocalIsoDate } from "@/lib/event-dates";
import { saveVibeCheckoutDraft } from "@/lib/vibe-checkout-draft";
import { slotMoodEmoji, vibeCopy } from "@/lib/vibe-copy";
import { VibeFlowSteps } from "@/components/vibe-flow-steps";
import { VenueNameButton } from "@/components/venue-name-button";

type PlanStop = ApprovedStopOffer & { scheduled_label?: string | null };

export function NightPackagePlanEditor({
  packageId,
  packageTitle,
  initialStops,
  catalog,
  partySizeMin,
  partySizeMax,
  commissionPct,
  allowEmptyStart = false,
  showShuffle = false,
}: {
  packageId: string;
  packageTitle: string;
  initialStops: PlanStop[];
  catalog: ApprovedStopOffer[];
  partySizeMin: number;
  partySizeMax: number;
  commissionPct: number;
  diyCompareCents?: number | null;
  travelMinutes?: number | null;
  vibeTags?: string[];
  allowEmptyStart?: boolean;
  showShuffle?: boolean;
}) {
  const router = useRouter();
  const minDate = toLocalIsoDate(new Date());
  const [stops, setStops] = useState<PlanStop[]>(initialStops);
  const [partySize, setPartySize] = useState(partySizeMin);
  const [startsOn, setStartsOn] = useState<string>(minDate);
  const [dateError, setDateError] = useState<string | null>(null);
  const [infoIndex, setInfoIndex] = useState<number | null>(null);
  const [picker, setPicker] = useState<{
    mode: "swap" | "add";
    index?: number;
    slotType?: string;
  } | null>(null);

  const unitSubtotal = useMemo(
    () => stops.reduce((sum, s) => sum + s.price_cents, 0),
    [stops],
  );
  const totals = nightPackageTotals({
    unitSubtotalCents: unitSubtotal,
    partySize,
    commissionPct,
  });
  const perPerson = totals.totalCents / 100 / Math.max(1, partySize);

  const selectedIds = new Set(stops.map((s) => s.id));

  const pickerOptions = useMemo(() => {
    if (!picker) return [];
    return catalog.filter((offer) => {
      if (selectedIds.has(offer.id) && picker.mode === "add") return false;
      if (picker.mode === "swap" && picker.index != null) {
        const current = stops[picker.index];
        if (current && offer.id === current.id) return false;
      }
      return true;
    });
  }, [catalog, picker, selectedIds, stops]);

  const sameSlotFirst = useMemo(() => {
    if (!picker?.slotType) return pickerOptions;
    const same = pickerOptions.filter((o) => o.slot_type === picker.slotType);
    const other = pickerOptions.filter((o) => o.slot_type !== picker.slotType);
    return [...same, ...other];
  }, [picker?.slotType, pickerOptions]);

  function applyPick(offer: PlanStop) {
    if (!picker) return;
    if (picker.mode === "add") {
      setStops((prev) => [...prev, offer]);
    } else if (picker.index != null) {
      setStops((prev) =>
        prev.map((s, i) =>
          i === picker.index
            ? { ...offer, scheduled_label: s.scheduled_label }
            : s,
        ),
      );
    }
    setPicker(null);
  }

  function continueToCheckout() {
    if (!stops.length) return;
    if (!startsOn || startsOn < minDate) {
      setDateError("Pick a start date (today or later).");
      return;
    }
    setDateError(null);
    const stopsParam = stops.map((s) => s.id).join(",");
    const params = new URLSearchParams({
      party: String(partySize),
      stops: stopsParam,
      startsOn,
    });
    saveVibeCheckoutDraft({
      packageId,
      party: partySize,
      stops: stopsParam,
      startsOn,
    });
    router.push(`/packages/${packageId}/checkout?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <VibeFlowSteps step={1} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight">{packageTitle}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="font-medium text-wtva-muted">Start date</span>
            <input
              type="date"
              min={minDate}
              value={startsOn}
              onChange={(e) => {
                setStartsOn(e.target.value);
                setDateError(null);
              }}
              className="mt-1 block rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 font-semibold [color-scheme:light]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-wtva-muted">Party size</span>
            <select
              className="mt-1 block rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 font-semibold"
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
            >
              {Array.from(
                { length: partySizeMax - partySizeMin + 1 },
                (_, i) => partySizeMin + i,
              ).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <p className="text-xs text-wtva-muted">
        We&apos;ll confirm this date with each place — subject to availability.
      </p>
      {dateError && <p className="text-sm text-red-500">{dateError}</p>}

      {showShuffle && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-wtva-dark-300 px-4 py-2 text-sm font-semibold hover:border-accent/40"
            onClick={() => {
              router.push(
                `/packages/${packageId}/plan?mode=random&r=${Date.now()}`,
              );
            }}
          >
            {vibeCopy.shuffleAgain}
          </button>
        </div>
      )}

      {allowEmptyStart && stops.length === 0 && (
        <p className="rounded-2xl border border-dashed border-wtva-dark-300 px-4 py-6 text-center text-sm text-wtva-muted">
          Your night is empty — add experiences from the live pool below.
        </p>
      )}

      <ul className="divide-y divide-wtva-dark-300 overflow-hidden rounded-2xl border border-wtva-dark-300 bg-wtva-card">
        {stops.map((stop, index) => {
          const time =
            stop.scheduled_label?.trim() ||
            stop.arrival_window?.split(/[–—-]/)[0]?.trim() ||
            "";
          const tip = stop.why_picked?.trim();
          return (
            <li key={`${stop.id}-${index}`} className="relative">
              <div className="flex min-h-[80px] items-center gap-3 px-4 py-3">
                <span className="text-2xl leading-none" aria-hidden>
                  {slotMoodEmoji(stop.slot_type)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold leading-tight">
                      {slotTypeLabel(stop.slot_type)}
                    </p>
                    {tip ? (
                      <button
                        type="button"
                        className="rounded-full p-0.5 text-wtva-muted hover:text-accent"
                        aria-label="Venue highlight"
                        onClick={() =>
                          setInfoIndex(infoIndex === index ? null : index)
                        }
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-wtva-muted">
                    <VenueNameButton
                      venueId={stop.venue?.id}
                      name={stop.venue?.name ?? "Place"}
                      className="inline text-sm"
                    />
                    {time ? ` · ${time}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-sm font-semibold text-accent hover:opacity-80"
                  onClick={() =>
                    setPicker({
                      mode: "swap",
                      index,
                      slotType: stop.slot_type,
                    })
                  }
                >
                  {vibeCopy.changeStop} ›
                </button>
              </div>
              {infoIndex === index && tip && (
                <p className="border-t border-wtva-dark-300 bg-wtva-dark-400/40 px-4 py-2.5 text-xs leading-relaxed text-wtva-muted">
                  <span className="font-semibold text-foreground">From the venue — </span>
                  {tip}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="w-full rounded-2xl border border-dashed border-wtva-dark-300 py-3 text-sm font-semibold text-wtva-muted hover:border-accent/40 hover:text-foreground"
        onClick={() => setPicker({ mode: "add" })}
        disabled={stops.length >= 12}
      >
        + Add experience
      </button>

      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5">
        <p className="text-2xl font-bold tabular-nums">{formatPrice(perPerson)}</p>
        <p className="mt-1 text-sm text-wtva-muted">per person · continue to pay</p>
        <button
          type="button"
          className={buttonClass("primary", "lg", "mt-4 w-full")}
          onClick={continueToCheckout}
          disabled={stops.length === 0}
        >
          {vibeCopy.continue} →
        </button>
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-3xl border border-wtva-dark-300 bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="font-bold">
                {picker.mode === "swap" ? "Change experience" : "Add experience"}
              </h3>
              <button
                type="button"
                className="text-sm font-semibold text-wtva-muted"
                onClick={() => setPicker(null)}
              >
                Close
              </button>
            </div>
            <ul className="max-h-[50vh] divide-y divide-wtva-dark-300 overflow-y-auto border-t border-wtva-dark-300">
              {sameSlotFirst.map((offer) => (
                <li
                  key={offer.id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{offer.title}</p>
                    <p className="truncate text-sm text-wtva-muted">
                      <VenueNameButton
                        venueId={offer.venue?.id}
                        name={offer.venue?.name ?? "Place"}
                        className="inline text-sm"
                      />
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-sm font-semibold text-accent hover:opacity-80"
                    onClick={() => applyPick(offer)}
                  >
                    {vibeCopy.changeStop}
                  </button>
                </li>
              ))}
              {sameSlotFirst.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-wtva-muted">
                  No other live experiences yet.
                </li>
              )}
            </ul>
            <div className="border-t border-wtva-dark-300 p-4">
              <Link
                href="/discover/concierge"
                className="block text-center text-sm font-semibold text-accent"
              >
                Ask Concierge
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

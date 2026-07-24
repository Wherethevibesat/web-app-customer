"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/lib/button";
import { formatPrice } from "@/lib/format";
import {
  slotTypeLabel,
  type ApprovedStopOffer,
} from "@/lib/data/night-packages-shared";
import { NightPackagePriceSummary } from "@/components/night-package-price-summary";

type PlanStop = ApprovedStopOffer;

export function NightPackagePlanEditor({
  packageId,
  packageTitle,
  initialStops,
  catalog,
  partySizeMin,
  partySizeMax,
  commissionPct,
}: {
  packageId: string;
  packageTitle: string;
  initialStops: PlanStop[];
  catalog: ApprovedStopOffer[];
  partySizeMin: number;
  partySizeMax: number;
  commissionPct: number;
}) {
  const router = useRouter();
  const [stops, setStops] = useState<PlanStop[]>(initialStops);
  const [partySize, setPartySize] = useState(partySizeMin);
  const [picker, setPicker] = useState<{
    mode: "swap" | "add";
    index?: number;
    slotType?: string;
  } | null>(null);

  const unitSubtotal = useMemo(
    () => stops.reduce((sum, s) => sum + s.price_cents, 0),
    [stops],
  );

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

  function removeStop(index: number) {
    if (stops.length <= 1) return;
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function applyPick(offer: PlanStop) {
    if (!picker) return;
    if (picker.mode === "add") {
      setStops((prev) => [...prev, offer]);
    } else if (picker.index != null) {
      setStops((prev) => prev.map((s, i) => (i === picker.index ? offer : s)));
    }
    setPicker(null);
  }

  function continueToCheckout() {
    if (!stops.length) return;
    const params = new URLSearchParams({
      party: String(partySize),
      stops: stops.map((s) => s.id).join(","),
    });
    router.push(`/packages/${packageId}/checkout?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-wtva-muted">Editing</p>
          <h2 className="text-xl font-bold">{packageTitle}</h2>
        </div>
        <label className="text-sm">
          <span className="font-medium">Party size</span>
          <select
            className="ml-2 rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
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

      <ol className="space-y-3">
        {stops.map((stop, index) => (
          <li
            key={`${stop.id}-${index}`}
            className="rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Stop {index + 1} · {slotTypeLabel(stop.slot_type)}
                </p>
                <p className="mt-1 font-semibold">{stop.title}</p>
                <p className="text-sm text-wtva-muted">
                  {stop.venue?.name ?? "Venue"}
                  {stop.arrival_window ? ` · ${stop.arrival_window}` : ""}
                </p>
                <p className="mt-1 font-semibold">{formatPrice(stop.price_cents / 100)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass("secondary", "sm")}
                  onClick={() =>
                    setPicker({
                      mode: "swap",
                      index,
                      slotType: stop.slot_type,
                    })
                  }
                >
                  Swap
                </button>
                <button
                  type="button"
                  className={buttonClass("ghost", "sm")}
                  disabled={stops.length <= 1}
                  onClick={() => removeStop(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className={buttonClass("secondary", "md", "w-full")}
        onClick={() => setPicker({ mode: "add" })}
        disabled={stops.length >= 12}
      >
        Add experience
      </button>

      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5">
        <h3 className="mb-4 font-bold">Review your night</h3>
        <NightPackagePriceSummary
          unitSubtotalCents={unitSubtotal}
          partySize={partySize}
          commissionPct={commissionPct}
          stops={stops.map((s) => ({ title: s.title, price_cents: s.price_cents }))}
        />
        <button
          type="button"
          className={buttonClass("primary", "lg", "mt-5 w-full")}
          onClick={continueToCheckout}
          disabled={stops.length === 0}
        >
          Continue to payment
        </button>
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-wtva-dark-300 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-wtva-dark-300 px-4 py-3">
              <h3 className="font-bold">
                {picker.mode === "swap" ? "Swap stop" : "Add experience"}
              </h3>
              <button
                type="button"
                className="text-sm font-semibold text-wtva-muted"
                onClick={() => setPicker(null)}
              >
                Close
              </button>
            </div>
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
              {sameSlotFirst.map((offer) => (
                <li key={offer.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-wtva-dark-300 px-4 py-3 text-left hover:border-accent/50"
                    onClick={() => applyPick(offer)}
                  >
                    <p className="text-xs font-semibold uppercase text-accent">
                      {slotTypeLabel(offer.slot_type)}
                    </p>
                    <p className="font-semibold">{offer.title}</p>
                    <p className="text-sm text-wtva-muted">
                      {offer.venue?.name ?? "Venue"} · {formatPrice(offer.price_cents / 100)}
                    </p>
                  </button>
                </li>
              ))}
              {sameSlotFirst.length === 0 && (
                <li className="py-6 text-center text-sm text-wtva-muted">
                  No other approved stops available yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

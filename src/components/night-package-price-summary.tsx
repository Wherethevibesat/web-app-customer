import { formatPrice } from "@/lib/format";
import { nightPackageTotals } from "@/lib/data/night-packages-shared";

export function NightPackagePriceSummary({
  unitSubtotalCents,
  partySize,
  commissionPct,
  stops,
}: {
  unitSubtotalCents: number;
  partySize: number;
  commissionPct: number;
  stops?: { title: string; price_cents: number }[];
}) {
  const { subtotalCents, serviceFeeCents, totalCents } = nightPackageTotals({
    unitSubtotalCents,
    partySize,
    commissionPct,
  });

  return (
    <div className="space-y-3 text-sm">
      {stops && stops.length > 0 && (
        <ul className="space-y-1.5 border-b border-wtva-dark-300 pb-3">
          {stops.map((stop, i) => (
            <li key={`${stop.title}-${i}`} className="flex justify-between gap-3">
              <span className="text-wtva-muted">
                {stop.title}
                {partySize > 1 ? ` × ${partySize}` : ""}
              </span>
              <span className="font-medium">
                {formatPrice((stop.price_cents * partySize) / 100)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-between">
        <span className="text-wtva-muted">Subtotal</span>
        <span className="font-semibold">{formatPrice(subtotalCents / 100)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-wtva-muted">Service fee ({commissionPct}%)</span>
        <span className="font-semibold">{formatPrice(serviceFeeCents / 100)}</span>
      </div>
      <div className="flex justify-between border-t border-wtva-dark-300 pt-3 text-base">
        <span className="font-bold">Total</span>
        <span className="font-bold">{formatPrice(totalCents / 100)}</span>
      </div>
    </div>
  );
}

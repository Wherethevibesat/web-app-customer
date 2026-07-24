import { formatPrice } from "@/lib/format";

export type ItineraryStop = {
  id: string;
  title: string;
  scheduled_label: string | null;
  redemption_code: string;
  status: string;
  sort_order: number;
  venue_name?: string | null;
  line_total_cents?: number | null;
};

export function NightPackageItinerary({
  confirmationCode,
  packageTitle,
  partySize,
  totalCents,
  stops,
}: {
  confirmationCode: string;
  packageTitle: string;
  partySize: number;
  totalCents: number;
  stops: ItineraryStop[];
}) {
  const ordered = [...stops].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Your night
          </p>
          <h2 className="mt-1 text-xl font-bold">{packageTitle}</h2>
          <p className="mt-1 text-sm text-wtva-muted">
            Confirmation{" "}
            <span className="font-mono font-semibold text-foreground">
              {confirmationCode}
            </span>
            {" · "}
            {partySize} {partySize === 1 ? "guest" : "guests"} ·{" "}
            {formatPrice(totalCents / 100)}
          </p>
        </div>
      </div>

      <ol className="relative mt-8 space-y-0 border-l-2 border-accent/30 pl-6">
        {ordered.map((stop, index) => (
          <li key={stop.id} className="relative pb-8 last:pb-0">
            <span className="absolute -left-[1.9rem] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-gradient text-[11px] font-bold text-white shadow-accent">
              {index + 1}
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {stop.scheduled_label || `Stop ${index + 1}`}
            </p>
            <p className="mt-1 font-semibold">{stop.title}</p>
            {stop.venue_name && (
              <p className="text-sm text-wtva-muted">{stop.venue_name}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-wtva-dark-300 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent">
                {stop.redemption_code}
              </span>
              <span className="capitalize text-wtva-muted">{stop.status}</span>
              {stop.line_total_cents != null && (
                <span className="font-medium">
                  {formatPrice(stop.line_total_cents / 100)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

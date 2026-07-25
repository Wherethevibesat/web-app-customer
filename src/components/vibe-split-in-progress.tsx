import Link from "next/link";
import { buttonClass } from "@/lib/button";
import type { OpenVibeSplit } from "@/lib/data/vibe-open-splits";
import { formatVibeStartLabel, type EventDateIso } from "@/lib/event-dates";
import { formatPrice } from "@/lib/format";

function expiresLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function VibeSplitInProgressList({
  splits,
  compact = false,
}: {
  splits: OpenVibeSplit[];
  compact?: boolean;
}) {
  if (splits.length === 0) return null;

  return (
    <ul className="space-y-3">
      {splits.map((split) => {
        const starts =
          split.startsOn && /^\d{4}-\d{2}-\d{2}$/.test(split.startsOn)
            ? formatVibeStartLabel(split.startsOn as EventDateIso)
            : split.startsOn;
        const cta =
          split.mySharePending && split.myAmountCents != null
            ? `Finish payment · ${formatPrice(split.myAmountCents / 100)}`
            : "Open waiting room";

        return (
          <li
            key={split.id}
            className="rounded-2xl border border-accent/35 bg-wtva-card p-4 md:p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
              In progress · split pay
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-tight">
              {split.packageTitle}
            </h3>
            <p className="mt-1 text-sm text-wtva-muted">
              {starts ? `Starting ${starts}` : null}
              {starts ? " · " : null}
              {split.partySize} {split.partySize === 1 ? "guest" : "guests"}
              {split.role === "host"
                ? ` · ${split.paidCount}/${split.payerCount} paid`
                : split.mySharePending
                  ? " · your share unpaid"
                  : " · your share paid · waiting on others"}
            </p>
            {!compact && (
              <p className="mt-1 text-xs text-wtva-subtle">
                Expires {expiresLabel(split.expiresAt)}
              </p>
            )}
            <Link
              href={`/packages/split/${split.inviteToken}`}
              className={buttonClass("primary", "md", "mt-4 w-full sm:w-auto")}
            >
              {cta}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

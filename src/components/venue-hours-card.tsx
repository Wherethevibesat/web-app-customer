"use client";

import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type HoursRow = { day: string; label: string };

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function VenueHoursCard({
  hoursLabel,
  isOpen,
  rows,
}: {
  hoursLabel: string | null;
  isOpen: boolean | null;
  rows: HoursRow[];
}) {
  const [open, setOpen] = useState(false);
  const today = DAY_NAMES[new Date().getDay()];
  const todayRow = rows.find((r) => r.day === today);
  const todaySummary = todayRow?.label ?? hoursLabel ?? null;
  const hasWeek = rows.length > 0;

  return (
    <div className="rounded-2xl border border-wtva-dark-300 bg-white p-5 shadow-card">
      <button
        type="button"
        onClick={() => hasWeek && setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-2 text-left",
          hasWeek ? "cursor-pointer" : "cursor-default",
        )}
      >
        <span className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <span className="text-base font-bold">Hours</span>
        </span>
        {hasWeek && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-wtva-muted transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      <div className="mt-2 text-sm">
        {isOpen === true && (
          <span className="font-semibold text-emerald-600">Open now</span>
        )}
        {isOpen === false && (
          <span className="font-semibold text-wtva-muted">Closed now</span>
        )}
        {todaySummary ? (
          <p className="text-wtva-muted">
            {isOpen != null && <span className="text-wtva-subtle">Today · </span>}
            {todaySummary}
          </p>
        ) : (
          isOpen == null && <p className="text-wtva-muted">Hours not available.</p>
        )}
      </div>

      {open && hasWeek && (
        <ul className="mt-3 space-y-1 border-t border-wtva-dark-300 pt-3 text-sm">
          {rows.map((row) => {
            const isToday = row.day === today;
            return (
              <li
                key={row.day}
                className={cn(
                  "flex justify-between gap-4 py-1.5",
                  isToday && "font-semibold text-foreground",
                )}
              >
                <span className={cn(!isToday && "text-wtva-muted")}>{row.day}</span>
                <span className={cn(!isToday && "font-medium")}>{row.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

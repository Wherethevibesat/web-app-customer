"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Plus } from "lucide-react";
import { CITIES, type City } from "@/lib/cities";
import { cn } from "@/lib/utils";

export function HeroCitySelect({ current }: { current: City }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectCity(city: City) {
    setOpen(false);
    if (city.live) {
      router.push("/");
      return;
    }
    router.push(`/coming-soon/${city.slug}`);
  }

  return (
    <span ref={containerRef} className="relative inline-flex align-baseline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 border-b-2 border-dashed border-white/40 pb-0.5 text-white transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        {current.name}
        <ChevronDown
          className={cn("h-[0.7em] w-[0.7em] transition-transform", open && "rotate-180")}
          strokeWidth={3}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-3 w-64 overflow-hidden rounded-2xl border border-wtva-dark-300 bg-white text-left shadow-card">
          <ul role="listbox" className="max-h-72 overflow-y-auto py-1.5 text-base">
            {CITIES.map((city) => (
              <li key={city.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={city.slug === current.slug}
                  onClick={() => selectCity(city)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-wtva-dark-400",
                    city.slug === current.slug ? "text-accent" : "text-foreground",
                  )}
                >
                  <span className="inline-flex items-center gap-2.5 tracking-wide">
                    <MapPin className="h-4 w-4 shrink-0 text-wtva-subtle" />
                    {city.name}, {city.state}
                  </span>
                  {city.live ? (
                    city.slug === current.slug ? (
                      <span className="text-xs font-semibold text-accent">Current</span>
                    ) : null
                  ) : (
                    <span className="rounded-full bg-wtva-dark-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wtva-muted">
                      Soon
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/request-city");
            }}
            className="flex w-full items-center gap-2.5 border-t border-wtva-dark-300 px-4 py-3 text-sm font-semibold tracking-wide text-accent transition-colors hover:bg-wtva-dark-400"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Request a city
          </button>
        </div>
      )}
    </span>
  );
}

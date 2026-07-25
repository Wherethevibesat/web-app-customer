"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { vibeCopy } from "@/lib/vibe-copy";

type TabId = "pick" | "curated";

const TABS: {
  id: TabId;
  label: string;
  subtitle: string;
}[] = [
  {
    id: "pick",
    label: vibeCopy.pickYourVibeTitle,
    subtitle: vibeCopy.pickYourVibeSubtitle,
  },
  {
    id: "curated",
    label: vibeCopy.curatedTitle,
    subtitle: "Designed by our concierge — brunch to late night, and everything between.",
  },
];

export function HomeVibeTabs({
  pick,
  curated,
}: {
  pick: ReactNode;
  curated: ReactNode;
}) {
  const [active, setActive] = useState<TabId>("pick");
  const current = TABS.find((t) => t.id === active) ?? TABS[0];
  const panels: Record<TabId, ReactNode> = { pick, curated };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {current.label}
          </h2>
          <p className="mt-1 max-w-xl text-wtva-muted">{current.subtitle}</p>
        </div>
        <Link
          href="/packages"
          className="text-sm font-semibold text-accent hover:opacity-80"
        >
          {vibeCopy.seeAllVibes} →
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Vibes"
        className="mb-6 inline-flex gap-1 rounded-full border border-wtva-dark-300 bg-wtva-card p-1 shadow-card"
      >
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`vibe-tab-${tab.id}`}
              aria-controls={`vibe-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-accent-gradient text-white shadow-accent"
                  : "text-wtva-muted hover:bg-wtva-dark-400 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {TABS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`vibe-panel-${tab.id}`}
          aria-labelledby={`vibe-tab-${tab.id}`}
          hidden={active !== tab.id}
        >
          {panels[tab.id]}
        </div>
      ))}
    </section>
  );
}

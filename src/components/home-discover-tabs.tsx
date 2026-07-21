"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type TabId = "featured" | "upcoming" | "venues";

const TABS: {
  id: TabId;
  label: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}[] = [
  {
    id: "featured",
    label: "Featured",
    subtitle: "Featured picks by WTVA",
    href: "/discover/events?featured=1",
    linkLabel: "View all",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    subtitle: "What's on the calendar",
    href: "/discover/events",
    linkLabel: "View all",
  },
  {
    id: "venues",
    label: "Venues",
    subtitle: "Clubs, lounges, and nightlife spots",
    href: "/venues",
    linkLabel: "View all",
  },
];

type HomeDiscoverTabsProps = {
  featured: ReactNode;
  upcoming: ReactNode;
  venues: ReactNode;
};

export function HomeDiscoverTabs({
  featured,
  upcoming,
  venues,
}: HomeDiscoverTabsProps) {
  const [active, setActive] = useState<TabId>("featured");
  const current = TABS.find((t) => t.id === active) ?? TABS[0];
  const panels: Record<TabId, ReactNode> = {
    featured,
    upcoming,
    venues,
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Explore Houston
          </h2>
          <p className="mt-1 text-wtva-muted">{current.subtitle}</p>
        </div>
        <Link
          href={current.href}
          className="text-sm font-semibold text-accent hover:opacity-80"
        >
          {current.linkLabel} →
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Explore Houston"
        className="mb-6 inline-flex max-w-full flex-wrap gap-1 rounded-full border border-wtva-dark-300 bg-wtva-card p-1 shadow-card"
      >
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`home-tab-${tab.id}`}
              aria-controls={`home-panel-${tab.id}`}
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
          id={`home-panel-${tab.id}`}
          aria-labelledby={`home-tab-${tab.id}`}
          hidden={active !== tab.id}
        >
          {panels[tab.id]}
        </div>
      ))}
    </section>
  );
}

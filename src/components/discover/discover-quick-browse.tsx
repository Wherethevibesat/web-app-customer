"use client";

import Link from "next/link";
import { Calendar, Map, MapPin } from "lucide-react";

type DiscoverQuickBrowseProps = {
  onAreasClick: () => void;
};

function QuickTile({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "flex flex-1 flex-col items-center gap-1 rounded-xl border border-wtva-dark-300/85 bg-wtva-dark-300 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40";

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  );
}

export function DiscoverQuickBrowse({ onAreasClick }: DiscoverQuickBrowseProps) {
  return (
    <div className="flex gap-2">
      <QuickTile
        icon={<Calendar className="h-5 w-5 text-wtva-muted" />}
        label="Events"
        href="/discover/events"
      />
      <QuickTile
        icon={<MapPin className="h-5 w-5 text-wtva-muted" />}
        label="Areas"
        onClick={onAreasClick}
      />
      <QuickTile
        icon={<Map className="h-5 w-5 text-wtva-muted" />}
        label="Map"
        href="/discover/map"
      />
    </div>
  );
}

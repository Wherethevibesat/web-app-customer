import type { BrowseItem } from "@/lib/browse-events";
import { EventCard } from "@/components/event-card";
import { EventSeriesCard } from "@/components/event-series-card";

export function BrowseEventCard({
  item,
  large,
}: {
  item: BrowseItem;
  large?: boolean;
}) {
  if (item.kind === "series") {
    return <EventSeriesCard series={item.series} large={large} />;
  }
  return <EventCard event={item.event} large={large} />;
}

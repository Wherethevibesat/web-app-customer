import { EventsBrowseView } from "@/components/pages/events-browse-view";

export default function DiscoverEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    neighborhood?: string;
    featured?: string;
    q?: string;
  }>;
}) {
  return <EventsBrowseView basePath="/discover/events" searchParams={searchParams} />;
}

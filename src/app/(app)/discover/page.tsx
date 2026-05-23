import { Suspense } from "react";
import { DiscoverPageClient } from "@/components/discover/discover-page-client";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { listVenues } from "@/lib/data/venues";

export default async function DiscoverPage() {
  const [venues, neighborhoods] = await Promise.all([
    listVenues().catch(() => []),
    listNeighborhoodOptions().catch(() => []),
  ]);

  return (
    <Suspense fallback={<div className="px-4 py-10 text-wtva-muted">Loading…</div>}>
      <DiscoverPageClient venues={venues} neighborhoods={neighborhoods} />
    </Suspense>
  );
}

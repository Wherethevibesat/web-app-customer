import { PageShell } from "@/components/page-shell";
import { PackagesHub } from "@/components/packages-hub";
import { listPublishedNightPackages } from "@/lib/data/night-packages";
import {
  matchesOccasionVibe,
  toPackageCard,
} from "@/lib/data/night-packages-shared";
import { createClient } from "@/lib/supabase/server";
import { occasionVibeLabel, vibeCopy } from "@/lib/vibe-copy";

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ vibe?: string }>;
}) {
  const { vibe: vibeParam } = await searchParams;
  const vibeKey = vibeParam?.trim() || null;
  const packages = await listPublishedNightPackages().catch(() => []);
  const cards = packages.map(toPackageCard);
  const filtered =
    vibeKey != null
      ? cards.filter((pkg) => matchesOccasionVibe(pkg, vibeKey))
      : cards;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasOrders = false;
  if (user) {
    const { count } = await supabase
      .from("night_package_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasOrders = (count ?? 0) > 0;
  }

  const occasionLabel = occasionVibeLabel(vibeKey);
  const subtitle = occasionLabel
    ? `Showing vibes for ${occasionLabel}.`
    : vibeCopy.curatedSubtitle;

  return (
    <PageShell title={vibeCopy.curatedTitle} subtitle={subtitle}>
      <PackagesHub
        packages={filtered}
        hasOrders={hasOrders}
        vibeFilter={vibeKey}
        vibeFilterLabel={occasionLabel}
        unfilteredCount={cards.length}
      />
    </PageShell>
  );
}

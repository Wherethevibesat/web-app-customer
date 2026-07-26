import { PageShell } from "@/components/page-shell";
import { PackagesHub } from "@/components/packages-hub";
import { listPublishedNightPackages } from "@/lib/data/night-packages";
import {
  matchesOccasionVibe,
  toPackageCard,
} from "@/lib/data/night-packages-shared";
import {
  listCustomerVibeOrders,
  vibeOrderPackage,
  vibeOrderStatusLabel,
} from "@/lib/data/vibe-orders";
import { createClient } from "@/lib/supabase/server";
import { occasionVibeLabel, vibeCopy } from "@/lib/vibe-copy";

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ vibe?: string; tab?: string }>;
}) {
  const { vibe: vibeParam, tab: tabParam } = await searchParams;
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

  const planRows = user
    ? (await listCustomerVibeOrders(supabase, user.id)).orders
    : [];

  const planSummaries = planRows.map((order) => {
    const pkg = vibeOrderPackage(order);
    return {
      id: order.id,
      title: pkg?.title ?? "Your vibe",
      status: order.status,
      statusLabel: vibeOrderStatusLabel(order.status),
      confirmationCode: order.confirmation_code,
      partySize: order.party_size,
      startsOn: order.starts_on,
      totalCents: order.total_cents,
      expiresAt: order.expires_at,
      packagePath: pkg ? pkg.slug || pkg.id : null,
    };
  });

  const occasionLabel = occasionVibeLabel(vibeKey);
  const subtitle = occasionLabel
    ? `Showing vibes for ${occasionLabel}.`
    : vibeCopy.curatedSubtitle;

  return (
    <PageShell title={vibeCopy.curatedTitle} subtitle={subtitle}>
      <PackagesHub
        packages={filtered}
        plans={planSummaries}
        initialTab={tabParam === "plans" || planSummaries.some((p) => p.status === "requested" || p.status === "awaiting_payment") ? "plans" : "vibes"}
        vibeFilter={vibeKey}
        vibeFilterLabel={occasionLabel}
        unfilteredCount={cards.length}
        signedIn={Boolean(user)}
      />
    </PageShell>
  );
}

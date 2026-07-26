import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { NightPackagePlanEditor } from "@/components/night-package-plan-editor";
import {
  DIY_VIBE_ID,
  DIY_VIBE_SLUG,
  getPublishedNightPackage,
  listApprovedStopOffers,
  shuffleRandomDiyVibe,
  type ApprovedStopOffer,
} from "@/lib/data/night-packages";
import { getNightPackageCommissionPct } from "@/lib/stripe/server";
import { vibeCopy } from "@/lib/vibe-copy";

type PlanStop = ApprovedStopOffer & { scheduled_label?: string | null };

function isDiyPackage(pkg: { id: string; slug: string | null }) {
  return pkg.slug === DIY_VIBE_SLUG || pkg.id === DIY_VIBE_ID;
}

export default async function PackagePlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const wantRandom = mode === "random" || mode === "surprise";

  const [pkg, catalog, commissionPct] = await Promise.all([
    getPublishedNightPackage(id).catch(() => null),
    listApprovedStopOffers().catch(() => [] as ApprovedStopOffer[]),
    getNightPackageCommissionPct().catch(() => 15),
  ]);
  if (!pkg) notFound();

  const diy = isDiyPackage(pkg);

  let initialStops: PlanStop[] = [];
  for (const s of pkg.stops ?? []) {
    const o = s.stop_offer;
    if (!o) continue;
    initialStops.push({
      id: o.id,
      title: o.title,
      description: o.description,
      slot_type: o.slot_type,
      price_cents: o.price_cents,
      inclusions: o.inclusions ?? [],
      arrival_window: o.arrival_window,
      image_url: o.image_url,
      why_picked: o.why_picked ?? "",
      duration_label: o.duration_label,
      dress_code: o.dress_code,
      crowd_label: o.crowd_label,
      venue: o.venue,
      scheduled_label: s.scheduled_label,
    });
  }

  if (diy && wantRandom) {
    const shuffled = await shuffleRandomDiyVibe().catch(() => [] as ApprovedStopOffer[]);
    initialStops = shuffled.map((o) => ({
      ...o,
      why_picked: o.why_picked ?? "",
      scheduled_label: null,
    }));
  }

  if (initialStops.length === 0 && !diy) {
    return (
      <PageShell title={vibeCopy.buildYourVibe}>
        <p className="text-wtva-muted">This vibe has no available experiences yet.</p>
        <Link href="/packages" className="mt-4 inline-block underline">
          Browse curated vibes
        </Link>
      </PageShell>
    );
  }

  if (diy && wantRandom && initialStops.length === 0) {
    return (
      <PageShell title={vibeCopy.surpriseMe}>
        <p className="text-wtva-muted">
          No live experiences in the pool yet. Build your own from the catalog, or check curated
          vibes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/packages/${DIY_VIBE_SLUG}/plan`}
            className="text-sm font-semibold text-accent underline"
          >
            Build your own
          </Link>
          <Link href="/packages" className="text-sm font-semibold underline">
            Curated vibes
          </Link>
        </div>
      </PageShell>
    );
  }

  const title = diy
    ? wantRandom
      ? vibeCopy.surpriseMe
      : vibeCopy.buildYourOwn
    : pkg.title;

  return (
    <PageShell
      title=""
      backHref={diy ? "/packages" : `/packages/${pkg.slug || pkg.id}`}
      backLabel={diy ? "Vibes" : "Back"}
    >
      <NightPackagePlanEditor
        packageId={pkg.id}
        packageTitle={title}
        initialStops={initialStops}
        catalog={catalog}
        partySizeMin={pkg.party_size_min}
        partySizeMax={pkg.party_size_max}
        commissionPct={commissionPct}
        allowEmptyStart={diy}
        showShuffle={diy}
      />
    </PageShell>
  );
}

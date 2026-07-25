import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { NightPackagePlanEditor } from "@/components/night-package-plan-editor";
import {
  getPublishedNightPackage,
  listApprovedStopOffers,
  type ApprovedStopOffer,
} from "@/lib/data/night-packages";
import { getNightPackageCommissionPct } from "@/lib/stripe/server";
import { vibeCopy } from "@/lib/vibe-copy";

export default async function PackagePlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pkg, catalog, commissionPct] = await Promise.all([
    getPublishedNightPackage(id).catch(() => null),
    listApprovedStopOffers().catch(() => [] as ApprovedStopOffer[]),
    getNightPackageCommissionPct().catch(() => 15),
  ]);
  if (!pkg) notFound();

  const initialStops = (pkg.stops ?? [])
    .map((s) => {
      const o = s.stop_offer;
      if (!o) return null;
      return {
        id: o.id,
        title: o.title,
        description: o.description,
        slot_type: o.slot_type,
        price_cents: o.price_cents,
        inclusions: o.inclusions ?? [],
        arrival_window: o.arrival_window,
        image_url: o.image_url,
        why_picked: o.why_picked,
        duration_label: o.duration_label,
        dress_code: o.dress_code,
        crowd_label: o.crowd_label,
        venue: o.venue,
        scheduled_label: s.scheduled_label,
      };
    })
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  if (initialStops.length === 0) {
    return (
      <PageShell title={vibeCopy.buildYourVibe}>
        <p className="text-wtva-muted">This vibe has no available experiences yet.</p>
        <Link href="/packages" className="mt-4 inline-block underline">
          Browse curated vibes
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title=""
      width="narrow"
      backHref={`/packages/${pkg.slug || pkg.id}`}
      backLabel="Back"
    >
      <NightPackagePlanEditor
        packageId={pkg.id}
        packageTitle={pkg.title}
        initialStops={initialStops}
        catalog={catalog}
        partySizeMin={pkg.party_size_min}
        partySizeMax={pkg.party_size_max}
        commissionPct={commissionPct}
      />
    </PageShell>
  );
}

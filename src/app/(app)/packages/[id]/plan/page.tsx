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

  const initialStops: ApprovedStopOffer[] = (pkg.stops ?? [])
    .map((s) => s.stop_offer)
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      slot_type: o.slot_type,
      price_cents: o.price_cents,
      inclusions: o.inclusions ?? [],
      arrival_window: o.arrival_window,
      image_url: o.image_url,
      venue: o.venue,
    }));

  if (initialStops.length === 0) {
    return (
      <PageShell title="Customize plan">
        <p className="text-wtva-muted">This template has no available stops yet.</p>
        <Link href="/packages" className="mt-4 inline-block underline">
          Browse templates
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Customize your plan"
      subtitle="Swap or add approved experiences, then checkout once for the whole night."
      width="narrow"
      backHref={`/packages/${pkg.slug || pkg.id}`}
      backLabel="Template"
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

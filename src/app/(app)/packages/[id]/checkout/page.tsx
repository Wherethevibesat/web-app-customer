import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { NightPackageCheckoutForm } from "@/components/night-package-checkout-form";
import { createClient } from "@/lib/supabase/server";
import { getPublishableKey } from "@/lib/stripe/server";
import { getPublishedNightPackage } from "@/lib/data/night-packages";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/lib/button";

export default async function NightPackageCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; party?: string; stops?: string }>;
}) {
  const { id } = await params;
  const { success, party, stops: stopsParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const q = new URLSearchParams();
    if (party) q.set("party", party);
    if (stopsParam) q.set("stops", stopsParam);
    const suffix = q.toString() ? `?${q}` : "";
    redirect(`/auth/login?next=${encodeURIComponent(`/packages/${id}/checkout${suffix}`)}`);
  }

  const pkg = await getPublishedNightPackage(id).catch(() => null);
  if (!pkg) {
    return (
      <PageShell title="Checkout">
        <p className="text-wtva-muted">Package not found or no longer available.</p>
        <Link href="/packages" className="mt-4 inline-block underline">
          Browse packages
        </Link>
      </PageShell>
    );
  }

  if (success === "1") {
    return (
      <PageShell title="Night booked" width="narrow">
        <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-8 text-center">
          <CheckCircle className="mx-auto h-14 w-14 text-green-400" />
          <h2 className="mt-4 text-xl font-bold">You&apos;re all set</h2>
          <p className="mt-2 text-sm text-wtva-muted">
            <strong>{pkg.title}</strong> is confirmed. Open your itinerary for per-stop codes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/packages/orders" className={buttonClass("primary", "md")}>
              View your night
            </Link>
            <Link
              href={`/packages/${pkg.slug || pkg.id}`}
              className={buttonClass("secondary", "md")}
            >
              Back to package
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const publishableKey = await getPublishableKey();
  if (!publishableKey) {
    return (
      <PageShell title="Checkout" width="narrow">
        <p className="text-sm text-wtva-muted">
          Stripe is not configured. Add keys in the admin portal under Stripe settings.
        </p>
      </PageShell>
    );
  }

  const defaultStopIds = (pkg.stops ?? [])
    .map((s) => s.stop_offer?.id)
    .filter((id): id is string => Boolean(id));
  const stopOfferIds = (stopsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const resolvedStops = stopOfferIds.length > 0 ? stopOfferIds : defaultStopIds;

  const partySize = Math.max(
    pkg.party_size_min,
    Math.min(pkg.party_size_max, Number(party) || pkg.party_size_min),
  );
  const perPerson = (pkg.subtotal_cents ?? 0) / 100;

  return (
    <PageShell title="Checkout" subtitle={pkg.title} width="narrow">
      <div className="mb-4">
        <Link
          href={`/packages/${pkg.id}/plan`}
          className="text-sm font-semibold text-accent hover:opacity-80"
        >
          ← Edit plan
        </Link>
      </div>
      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6 md:p-8">
        <h2 className="text-lg font-bold">{pkg.title}</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          {resolvedStops.length} stops · template from {formatPrice(perPerson)} / person
        </p>
        <div className="mt-8">
          <NightPackageCheckoutForm
            packageId={pkg.id}
            packageName={pkg.title}
            publishableKey={publishableKey}
            partySize={partySize}
            partySizeMin={pkg.party_size_min}
            partySizeMax={pkg.party_size_max}
            stopOfferIds={resolvedStops}
          />
        </div>
      </div>
    </PageShell>
  );
}

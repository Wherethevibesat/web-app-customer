import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { CheckoutAuthPanel } from "@/components/checkout-auth-panel";
import { VibeCheckoutDraftPersist } from "@/components/vibe-checkout-draft-persist";
import { VibeCheckoutResume } from "@/components/vibe-checkout-resume";
import { NightPackageCheckoutForm } from "@/components/night-package-checkout-form";
import { createClient } from "@/lib/supabase/server";
import {
  getNightPackageCommissionPct,
  getPublishableKey,
} from "@/lib/stripe/server";
import {
  getPublishedNightPackage,
  listApprovedStopOffers,
} from "@/lib/data/night-packages";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/lib/button";
import { vibeCopy } from "@/lib/vibe-copy";
import { VibeFlowSteps } from "@/components/vibe-flow-steps";
import {
  VibeExperienceCard,
  VibeExperienceCardGrid,
} from "@/components/vibe-experience-card";
import {
  formatVibeStartLabel,
  isIsoDateOnOrAfterToday,
  type EventDateIso,
} from "@/lib/event-dates";

export default async function NightPackageCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    success?: string;
    party?: string;
    stops?: string;
    startsOn?: string;
  }>;
}) {
  const { id } = await params;
  const { success, party, stops: stopsParam, startsOn: startsOnParam } =
    await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [pkg, catalog] = await Promise.all([
    getPublishedNightPackage(id).catch(() => null),
    listApprovedStopOffers().catch(() => []),
  ]);
  if (!pkg) {
    return (
      <PageShell title="Checkout">
        <p className="text-wtva-muted">This vibe is no longer available.</p>
        <Link href="/packages" className="mt-4 inline-block underline">
          Browse curated vibes
        </Link>
      </PageShell>
    );
  }

  const planHref = `/packages/${pkg.id}/plan`;

  if (success === "1") {
    const startLabel =
      startsOnParam && isIsoDateOnOrAfterToday(startsOnParam)
        ? formatVibeStartLabel(startsOnParam as EventDateIso)
        : null;
    return (
      <PageShell title={vibeCopy.bookedTitle} width="narrow">
        <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-8 text-center">
          <CheckCircle className="mx-auto h-14 w-14 text-green-400" />
          <h2 className="mt-4 text-xl font-bold">You&apos;re done</h2>
          <p className="mt-2 text-sm text-wtva-muted">
            <strong>{pkg.title}</strong> is booked
            {startLabel ? ` for ${startLabel}` : ""}. Open your plan for per-stop
            codes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/packages/orders" className={buttonClass("primary", "md")}>
              View {vibeCopy.myPlans}
            </Link>
            <Link
              href={`/packages/${pkg.slug || pkg.id}`}
              className={buttonClass("secondary", "md")}
            >
              Back to vibe
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!startsOnParam || !isIsoDateOnOrAfterToday(startsOnParam)) {
    // Client may restore draft after login; avoid hard-bounce to Build.
    return (
      <PageShell title="Checkout" width="narrow" backHref={planHref} backLabel="Back">
        <VibeCheckoutResume packageId={pkg.id} />
      </PageShell>
    );
  }
  const startsOn = startsOnParam as EventDateIso;

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

  const packageStops = (pkg.stops ?? [])
    .map((s) => s.stop_offer)
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  const defaultStopIds = packageStops.map((s) => s.id);
  const stopOfferIds = (stopsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const resolvedStopIds = stopOfferIds.length > 0 ? stopOfferIds : defaultStopIds;

  const offerById = new Map(
    [...packageStops, ...catalog].map((s) => [s.id, s] as const),
  );
  const displayLines = resolvedStopIds
    .map((stopId) => {
      const offer = offerById.get(stopId);
      if (!offer) return null;
      return {
        id: offer.id,
        title: offer.title,
        slot_type: offer.slot_type,
        price_cents: offer.price_cents,
        arrival_window: offer.arrival_window ?? null,
        image_url: "image_url" in offer ? (offer.image_url as string | null) : null,
        why_picked: "why_picked" in offer ? (offer.why_picked as string | undefined) : undefined,
        venue: offer.venue ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const partySize = Math.max(
    pkg.party_size_min,
    Math.min(pkg.party_size_max, Number(party) || pkg.party_size_min),
  );

  const unitSubtotal = displayLines.reduce((sum, l) => sum + l.price_cents, 0);
  const subtotalCents = unitSubtotal * partySize;
  const commissionPct = await getNightPackageCommissionPct().catch(() => 15);
  const estimatedTotal =
    (subtotalCents + Math.round((subtotalCents * commissionPct) / 100)) / 100;

  return (
    <PageShell title="" backHref={planHref} backLabel="Back">
      <VibeCheckoutDraftPersist
        packageId={pkg.id}
        party={partySize}
        stops={resolvedStopIds.join(",")}
        startsOn={startsOn}
      />
      <VibeFlowSteps step={2} />

      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {vibeCopy.yourVibe}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            {pkg.title}
          </h1>
          <p className="mt-1 text-sm text-wtva-muted">
            Starting {formatVibeStartLabel(startsOn)} · {displayLines.length}{" "}
            experiences · {partySize} {partySize === 1 ? "guest" : "guests"}
          </p>
        </div>

        <VibeExperienceCardGrid>
          {displayLines.map((line, index) => (
            <li key={line.id}>
              <VibeExperienceCard
                stop={line}
                index={index}
                total={displayLines.length}
              />
            </li>
          ))}
        </VibeExperienceCardGrid>

        <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5 md:p-6 sm:max-w-lg">
          <p className="text-sm text-wtva-muted">
            Total due ·{" "}
            <span className="font-bold text-foreground tabular-nums">
              {formatPrice(estimatedTotal)}
            </span>
          </p>
          <div className="mt-5 space-y-6">
            {!user ? (
              <>
                <p className="rounded-xl border border-wtva-dark-300 bg-wtva-dark-400/50 px-4 py-3 text-sm text-wtva-muted">
                  Your vibe is ready — sign in to pay. You won&apos;t lose this plan.
                </p>
                <CheckoutAuthPanel
                  continueHref={`/packages/${pkg.id}/checkout?party=${partySize}&stops=${encodeURIComponent(resolvedStopIds.join(","))}&startsOn=${startsOn}`}
                />
              </>
            ) : (
              <NightPackageCheckoutForm
                packageId={pkg.id}
                packageName={pkg.title}
                publishableKey={publishableKey}
                partySize={partySize}
                partySizeMin={pkg.party_size_min}
                partySizeMax={pkg.party_size_max}
                stopOfferIds={resolvedStopIds}
                startsOn={startsOn}
                estimatedTotal={estimatedTotal}
                hidePartySelect
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

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
    orderId?: string;
  }>;
}) {
  const { id } = await params;
  const {
    success,
    party,
    stops: stopsParam,
    startsOn: startsOnParam,
    orderId: orderIdParam,
  } = await searchParams;

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

  // Pay after venue confirm: load awaiting_payment order
  let existingOrder: {
    id: string;
    party_size: number;
    starts_on: string | null;
    total_cents: number;
    status: string;
    stop_offer_ids: string[];
  } | null = null;

  if (orderIdParam && user) {
    const { data: orderRow } = await supabase
      .from("night_package_orders")
      .select(
        `
        id, party_size, starts_on, total_cents, status, user_id,
        stops:night_package_order_stops(stop_offer_id, sort_order)
      `,
      )
      .eq("id", orderIdParam)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderRow && orderRow.status === "awaiting_payment") {
      const stops = (
        (orderRow.stops as { stop_offer_id: string; sort_order: number }[]) ?? []
      )
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);
      existingOrder = {
        id: orderRow.id as string,
        party_size: Number(orderRow.party_size),
        starts_on: orderRow.starts_on as string | null,
        total_cents: Number(orderRow.total_cents),
        status: orderRow.status as string,
        stop_offer_ids: stops.map((s) => s.stop_offer_id),
      };
    }
  }

  const effectiveStartsOn =
    existingOrder?.starts_on || startsOnParam || "";

  if (!effectiveStartsOn || !isIsoDateOnOrAfterToday(effectiveStartsOn)) {
    // Client may restore draft after login; avoid hard-bounce to Build.
    return (
      <PageShell title="Checkout" width="narrow" backHref={planHref} backLabel="Back">
        <VibeCheckoutResume packageId={pkg.id} />
      </PageShell>
    );
  }
  const startsOn = effectiveStartsOn as EventDateIso;

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
  const resolvedStopIds =
    existingOrder?.stop_offer_ids?.length
      ? existingOrder.stop_offer_ids
      : stopOfferIds.length > 0
        ? stopOfferIds
        : defaultStopIds;

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
    Math.min(
      pkg.party_size_max,
      existingOrder?.party_size || Number(party) || pkg.party_size_min,
    ),
  );

  const unitSubtotal = displayLines.reduce((sum, l) => sum + l.price_cents, 0);
  const subtotalCents = unitSubtotal * partySize;
  const commissionPct = await getNightPackageCommissionPct().catch(() => 15);
  const estimatedTotal =
    existingOrder != null
      ? existingOrder.total_cents / 100
      : (subtotalCents + Math.round((subtotalCents * commissionPct) / 100)) / 100;

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
            {existingOrder ? "Pay to lock in · " : "Total due · "}
            <span className="font-bold text-foreground tabular-nums">
              {formatPrice(estimatedTotal)}
            </span>
          </p>
          {existingOrder && (
            <p className="mt-2 text-sm text-accent font-semibold">
              All venues confirmed — complete payment to book.
            </p>
          )}
          <div className="mt-5 space-y-6">
            {!user ? (
              <>
                <p className="rounded-xl border border-wtva-dark-300 bg-wtva-dark-400/50 px-4 py-3 text-sm text-wtva-muted">
                  Your vibe is ready — sign in to continue. You won&apos;t lose this plan.
                </p>
                <CheckoutAuthPanel
                  continueHref={`/packages/${pkg.id}/checkout?party=${partySize}&stops=${encodeURIComponent(resolvedStopIds.join(","))}&startsOn=${startsOn}${existingOrder ? `&orderId=${existingOrder.id}` : ""}`}
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
                existingOrderId={existingOrder?.id ?? null}
              />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

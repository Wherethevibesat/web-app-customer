import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { VipCheckoutForm } from "@/components/vip-checkout-form";
import { createClient } from "@/lib/supabase/server";
import { getPublishableKey, getVipPackage } from "@/lib/stripe/server";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/lib/button";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ packageId: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { packageId } = await params;
  const { success } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/checkout/${packageId}`);

  const pkg = await getVipPackage(packageId);
  if (!pkg) {
    return (
      <PageShell title="Checkout">
        <p className="text-wtva-muted">Package not found or no longer available.</p>
        <Link href="/events" className="mt-4 inline-block underline">
          Browse events
        </Link>
      </PageShell>
    );
  }

  const event = pkg.event as { id: string; title: string } | { id: string; title: string }[] | null;
  const eventRow = Array.isArray(event) ? event[0] : event;

  if (success === "1") {
    return (
      <PageShell title="Purchase complete" width="narrow">
        <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-8 text-center">
          <CheckCircle className="mx-auto h-14 w-14 text-green-400" />
          <h2 className="mt-4 text-xl font-bold">You&apos;re all set</h2>
          <p className="mt-2 text-sm text-wtva-muted">
            VIP package <strong>{pkg.package_name}</strong> confirmed.
          </p>
          {eventRow && (
            <Link href={`/events/${eventRow.id}`} className={buttonClass("primary", "md", "mt-6")}>
              Back to event
            </Link>
          )}
        </div>
      </PageShell>
    );
  }

  const publishableKey = await getPublishableKey();
  if (!publishableKey) {
    return (
      <PageShell title="Checkout" width="narrow">
        <p className="text-sm text-wtva-muted">
          Stripe is not configured. Add keys in the admin portal under Stripe settings, or set{" "}
          <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and <code>STRIPE_SECRET_KEY</code>.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="VIP checkout"
      subtitle={eventRow ? eventRow.title : undefined}
      width="narrow"
    >
      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6 md:p-8">
        <h2 className="text-lg font-bold">{pkg.package_name}</h2>
        <p className="mt-1 text-wtva-muted text-sm">{pkg.description}</p>
        <p className="mt-4 text-xl font-bold">{formatPrice(Number(pkg.price))}</p>
        <div className="mt-8">
          <VipCheckoutForm
            packageId={packageId}
            packageName={pkg.package_name}
            publishableKey={publishableKey}
          />
        </div>
      </div>
      {eventRow && (
        <Link
          href={`/events/${eventRow.id}`}
          className="mt-6 inline-block text-sm text-wtva-muted underline hover:text-foreground"
        >
          ← Back to event
        </Link>
      )}
    </PageShell>
  );
}

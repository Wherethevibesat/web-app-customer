import { MobilePayCheckout } from "@/components/mobile-pay-checkout";
import { verifyMobilePayToken } from "@/lib/stripe/mobile-pay-token";
import { getPublishableKey } from "@/lib/stripe/server";

export default async function MobilePayPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const payload = t ? verifyMobilePayToken(t) : null;
  const publishableKey = await getPublishableKey();

  if (!payload || !publishableKey) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-wtva-dark-500 px-4">
        <p className="max-w-sm text-center text-sm text-wtva-muted">
          This payment link is invalid or expired. Go back to the app and try again.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-wtva-dark-500 text-foreground">
      <MobilePayCheckout
        publishableKey={publishableKey}
        clientSecret={payload.cs}
        paymentIntentId={payload.pi}
        kind={payload.kind}
        amountLabel={payload.amountLabel}
      />
    </main>
  );
}

import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { CheckoutAuthPanel } from "@/components/checkout-auth-panel";
import { VibeSplitWaitingRoom } from "@/components/vibe-split-waiting-room";
import { createClient } from "@/lib/supabase/server";
import { getPublishableKey } from "@/lib/stripe/server";
import { getGroupByToken } from "@/lib/stripe/vibe-split";
import { vibeCopy } from "@/lib/vibe-copy";
import { buttonClass } from "@/lib/button";

export default async function VibeSplitInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const group = await getGroupByToken(token);
  if (!group) {
    return (
      <PageShell title="Split invite">
        <p className="text-wtva-muted">This invite link is invalid or expired.</p>
        <Link href="/packages" className={`${buttonClass("primary", "md")} mt-4`}>
          Browse {vibeCopy.curatedTitle}
        </Link>
      </PageShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const publishableKey = await getPublishableKey();

  const pkg = group.package as { title?: string; slug?: string } | null;
  const shares = (group.shares as Array<{
    id: string;
    role: string;
    amount_cents: number;
    status: string;
    user_id: string | null;
    invite_label: string | null;
  }>) ?? [];

  return (
    <PageShell title="Split the vibe" width="narrow">
      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Split with friends
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {pkg?.title ?? "Curated vibe"}
        </h1>
        <p className="mt-1 text-sm text-wtva-muted">
          Starting {String(group.starts_on)} · {Number(group.party_size)} guests ·{" "}
          {shares.filter((s) => s.status === "paid").length}/{shares.length} paid
        </p>

        {!user ? (
          <div className="mt-6">
            <CheckoutAuthPanel />
          </div>
        ) : !publishableKey ? (
          <p className="mt-6 text-sm text-wtva-muted">Checkout is not configured.</p>
        ) : (
          <div className="mt-6">
            <VibeSplitWaitingRoom
              token={token}
              publishableKey={publishableKey}
              userId={user.id}
              initial={{
                id: group.id as string,
                status: group.status as string,
                total: Number(group.total_cents) / 100,
                expiresAt: group.expires_at as string,
                shares: shares.map((s) => ({
                  id: s.id,
                  role: s.role,
                  amount: s.amount_cents / 100,
                  status: s.status,
                  userId: s.user_id,
                  label: s.invite_label,
                })),
              }}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}

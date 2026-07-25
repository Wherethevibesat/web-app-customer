import type { SupabaseClient } from "@supabase/supabase-js";

export type OpenVibeSplit = {
  id: string;
  inviteToken: string;
  packageTitle: string;
  partySize: number;
  startsOn: string;
  totalCents: number;
  expiresAt: string;
  paidCount: number;
  payerCount: number;
  mySharePending: boolean;
  myAmountCents: number | null;
  role: "host" | "guest" | null;
};

type ShareRow = {
  id: string;
  status: string;
  role: string;
  amount_cents: number;
  user_id: string | null;
};

/** Open split groups the user hosts or has claimed a share on. */
export async function listOpenVibeSplits(
  supabase: SupabaseClient,
  userId: string,
): Promise<OpenVibeSplit[]> {
  const { data, error } = await supabase
    .from("vibe_payment_groups")
    .select(
      `
      id, invite_token, party_size, starts_on, total_cents, status, expires_at, payer_count,
      host_user_id,
      package:night_packages(title),
      shares:vibe_payment_shares(id, status, role, amount_cents, user_id)
    `,
    )
    .eq("status", "collecting")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const now = Date.now();
  return data
    .map((row) => {
      const expiresAt = row.expires_at as string;
      if (new Date(expiresAt).getTime() <= now) return null;

      const pkg = row.package as
        | { title: string }
        | { title: string }[]
        | null;
      const pkgRow = Array.isArray(pkg) ? pkg[0] : pkg;
      const shares = (row.shares as ShareRow[] | null) ?? [];
      const paidCount = shares.filter((s) => s.status === "paid").length;
      const myShare = shares.find((s) => s.user_id === userId) ?? null;
      const isHost = row.host_user_id === userId;
      if (!isHost && !myShare) return null;

      return {
        id: row.id as string,
        inviteToken: row.invite_token as string,
        packageTitle: pkgRow?.title ?? "Your vibe",
        partySize: Number(row.party_size) || 1,
        startsOn: row.starts_on as string,
        totalCents: Number(row.total_cents) || 0,
        expiresAt,
        paidCount,
        payerCount: Number(row.payer_count) || shares.length || 0,
        mySharePending: myShare ? myShare.status === "pending" : isHost,
        myAmountCents: myShare?.amount_cents ?? null,
        role: (myShare?.role as "host" | "guest" | undefined) ??
          (isHost ? "host" : null),
      } satisfies OpenVibeSplit;
    })
    .filter((x): x is OpenVibeSplit => Boolean(x));
}

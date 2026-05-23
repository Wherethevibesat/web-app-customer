import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { NewMessagePanel } from "@/components/new-message-panel";
import { PageShell } from "@/components/page-shell";
import { ThreadList } from "@/components/thread-list";
import { createClient } from "@/lib/supabase/server";
import { listMyThreads, searchCustomersForChat } from "@/lib/data/messages";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/messages");

  let threads: Awaited<ReturnType<typeof listMyThreads>> = [];
  let messagingReady = true;
  try {
    threads = await listMyThreads(user.id);
  } catch {
    messagingReady = false;
  }

  const users = messagingReady
    ? await searchCustomersForChat("", user.id).catch(() => [])
    : [];

  return (
    <PageShell title="Messages" subtitle="Connect with friends and venues" width="wide">
      <AccountNav />
      {!messagingReady && (
        <div className="mt-6 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm">
          Messaging tables are not available yet. Run Supabase migration{" "}
          <code className="text-foreground">006_v2_messaging_and_orders.sql</code> and set{" "}
          <code className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
          <code className="text-foreground">.env.local</code>.
        </div>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <ThreadList threads={threads} />
          {threads.length === 0 && messagingReady && (
            <p className="text-sm text-wtva-muted text-center">
              Or{" "}
              <Link href="/venues" className="underline hover:text-foreground">
                message a venue
              </Link>{" "}
              from their profile page.
            </p>
          )}
        </div>
        <aside>
          {messagingReady && <NewMessagePanel users={users} />}
        </aside>
      </div>
    </PageShell>
  );
}

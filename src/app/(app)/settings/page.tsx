import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { PageShell } from "@/components/page-shell";
import { SettingsForm } from "@/components/settings-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/settings");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  return (
    <PageShell title="Settings" subtitle="Update your profile and preferences" width="wide">
      <AccountNav />
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="mt-4">
            <SettingsForm
              initialName={profile?.name ?? ""}
              email={profile?.email ?? user.email ?? ""}
            />
          </div>
        </section>
        <section className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-6">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="mt-2 text-sm text-wtva-muted">
            Push and email preferences are managed in the mobile app for now. Web
            notifications are coming in a future update.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-wtva-subtle">
            <li className="flex items-center justify-between">
              <span>Event reminders</span>
              <span className="rounded bg-wtva-dark-300 px-2 py-0.5 text-xs">App</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Venue check-in rewards</span>
              <span className="rounded bg-wtva-dark-300 px-2 py-0.5 text-xs">App</span>
            </li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

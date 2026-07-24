import { PageShell } from "@/components/page-shell";
import { PackagesHub } from "@/components/packages-hub";
import { listPublishedNightPackages } from "@/lib/data/night-packages";
import { toPackageCard } from "@/lib/data/night-packages-shared";
import { createClient } from "@/lib/supabase/server";

export default async function PackagesPage() {
  const packages = await listPublishedNightPackages().catch(() => []);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasOrders = false;
  if (user) {
    const { count } = await supabase
      .from("night_package_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasOrders = (count ?? 0) > 0;
  }

  return (
    <PageShell
      title="Build Your Night"
      subtitle="Choose a template, customize stops, and pay once for the whole flow."
    >
      <PackagesHub
        packages={packages.map(toPackageCard)}
        hasOrders={hasOrders}
      />
    </PageShell>
  );
}

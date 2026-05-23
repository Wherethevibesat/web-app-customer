import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";

export async function SiteHeaderWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.name ?? user.email?.split("@")[0] ?? "Account";
  }

  return <SiteHeader userName={displayName} isSignedIn={!!user} />;
}

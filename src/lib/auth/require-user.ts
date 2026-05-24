import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";
import type { SupabaseClient, User } from "@supabase/supabase-js";

function bearerToken(request?: Request): string | null {
  const header = request?.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export async function requireUser(request?: Request): Promise<{
  user: User | null;
  supabase: SupabaseClient;
}> {
  const token = bearerToken(request);
  const { url, anonKey } = requireSupabasePublicEnv();

  const supabase: SupabaseClient = token
    ? createSupabaseClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : await createCookieClient();

  const { data: { user } } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  return { user, supabase };
}

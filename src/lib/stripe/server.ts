import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export async function getPublishableKey(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stripe_settings")
    .select("publishable_key")
    .eq("id", 1)
    .maybeSingle();
  return data?.publishable_key ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}

export async function getVipPackage(packageId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vip_packages")
    .select("*, event:events(id, title), venue:venues(id, name)")
    .eq("id", packageId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordVipOrder(params: {
  userId: string;
  vipPackageId: string;
  eventId: string | null;
  amount: number;
  paymentIntentId: string;
  status: "paid" | "failed";
}) {
  const admin = createAdminClient();
  await admin.from("vip_orders").insert({
    user_id: params.userId,
    vip_package_id: params.vipPackageId,
    event_id: params.eventId,
    amount: params.amount,
    stripe_payment_intent_id: params.paymentIntentId,
    status: params.status,
    updated_at: new Date().toISOString(),
  });
}

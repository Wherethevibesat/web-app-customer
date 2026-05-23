import { redirect } from "next/navigation";

export default async function LegacyEventsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const suffix = qs.toString();
  redirect(suffix ? `/discover/events?${suffix}` : "/discover/events");
}

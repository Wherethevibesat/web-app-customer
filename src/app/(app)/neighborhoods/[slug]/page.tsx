import { redirect } from "next/navigation";

export default async function LegacyNeighborhoodRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value) qs.set(key, value);
  }
  const suffix = qs.toString();
  redirect(
    suffix
      ? `/discover/neighborhoods/${slug}?${suffix}`
      : `/discover/neighborhoods/${slug}`,
  );
}

import { redirect } from "next/navigation";

export default async function DiscoverSearchRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  redirect(`/search?${params.toString()}`);
}

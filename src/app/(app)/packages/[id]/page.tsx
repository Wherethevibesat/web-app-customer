import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { VibePreview } from "@/components/vibe-preview";
import { getPublishedNightPackage } from "@/lib/data/night-packages";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getPublishedNightPackage(id).catch(() => null);
  if (!pkg) notFound();

  return (
    <PageShell
      title=""
      width="narrow"
      backHref="/packages"
      backLabel="Curated Vibes"
    >
      <VibePreview pkg={pkg} />
    </PageShell>
  );
}

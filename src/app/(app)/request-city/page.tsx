import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { RequestCityForm } from "@/components/request-city-form";
import { cityLabel, getCity } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Request a city",
  description: "Tell us where Where The Vibes At should launch next.",
};

export default async function RequestCityPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: slug } = await searchParams;
  const known = getCity(slug);
  const initialCity = known ? cityLabel(known) : "";

  return (
    <PageShell
      title="Request a city"
      subtitle="We're expanding city by city. Tell us where to go next and we'll notify you when we launch."
      width="narrow"
    >
      <RequestCityForm initialCity={initialCity} />
    </PageShell>
  );
}

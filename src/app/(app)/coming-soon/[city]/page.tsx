import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { buttonClass } from "@/lib/button";
import { cityLabel, DEFAULT_CITY, getCity } from "@/lib/cities";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "Coming soon" };
  return {
    title: `${city.name} — Coming soon`,
    description: `Where The Vibes At is launching in ${cityLabel(city)} soon.`,
  };
}

const HIGHLIGHTS = [
  "Curated events, day parties, and club nights",
  "Venue profiles, hours, and VIP tables",
  "Check in, earn points, and climb the leaderboard",
  "A concierge that finds your vibe",
];

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = getCity(slug);

  // Unknown city, or a city that is already live → nothing to tease here.
  if (!city || city.live) {
    redirect("/");
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-accent-gradient opacity-[0.06]" />
      <div className="relative mx-auto max-w-3xl px-4 py-16 text-center lg:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-wtva-dark-300 bg-wtva-card px-4 py-1.5 text-sm font-semibold text-accent shadow-sm">
          <MapPin className="h-4 w-4" />
          {cityLabel(city)}
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
          We&apos;re bringing the vibes to{" "}
          <span className="text-accent-gradient">{city.name}</span> soon.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-lg text-wtva-muted">
          Where The Vibes At is expanding, and{" "}
          <strong className="text-foreground">{city.name}</strong>{" "}
          is next up. It&apos;s not live just yet — request early access and we&apos;ll let you
          know the moment we launch.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/request-city?city=${city.slug}`}
            className={buttonClass("primary", "lg")}
          >
            Notify me when we launch <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/" className={buttonClass("secondary", "lg")}>
            Explore {DEFAULT_CITY.name} (live now)
          </Link>
        </div>

        <div className="mx-auto mt-14 max-w-xl rounded-3xl border border-wtva-dark-300 bg-wtva-card p-8 text-left shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-accent" />
            What to expect in {city.name}
          </h2>
          <ul className="mt-4 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-wtva-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

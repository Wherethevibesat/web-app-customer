import Link from "next/link";
import { headers } from "next/headers";
import { PageShell } from "@/components/page-shell";
import { getBusinessPortalUrl } from "@/lib/business-portal-url";

const CONTACT_EMAIL = "business@wherethevibesat.com";

export default async function AboutPage() {
  const host = (await headers()).get("host");
  const registerUrl = getBusinessPortalUrl("/auth/register", host);
  return (
    <PageShell
      title="About Where The Vibes At"
      subtitle="Houston nightlife, events, and where the crowd is going"
      width="narrow"
    >
      <div className="prose prose-invert max-w-none space-y-6 text-wtva-muted leading-relaxed">
        <p>
          WTVA helps you find what&apos;s happening in Houston — day parties, club nights,
          happy hours, live DJ sets, age-specific nights, and VIP at lounges and nightlife
          spots. Browse by neighborhood, event type, day, or date, and filter down to what
          fits your night.
        </p>
        <p>
          Recurring weekly events show as one series with the next date upfront; tap through
          to pick a night and buy tickets when they&apos;re available. One-off events work the
          same way — details, venue, and checkout on the date you choose.
        </p>
        <p>
          Check in when you go out to earn points and climb the city leaderboard. Save
          favorite venues, explore the map and neighborhoods, and message venues when you need
          more info. VIP packages and promoter table offers are available on select events and
          venues when hosts list them.
        </p>

        <h2 className="text-xl font-bold text-foreground">Our platforms</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-foreground">wherethevibesat.com</strong> — discover events,
            venues, promoters, and drivers; purchase tickets and VIP; check in and track your
            rank
          </li>
          <li>
            <strong className="text-foreground">Mobile app</strong>{" "}
            <span className="text-wtva-subtle">(coming soon)</span> — check-ins, messaging, and
            on-the-go discovery for the full social experience
          </li>
          <li>
            <strong className="text-foreground">Business portal</strong> — venues, promoters, and
            drivers manage listings, events, VIP, table offers, and ride services
          </li>
        </ul>

        <h2 className="text-xl font-bold text-foreground">For venues, promoters &amp; drivers</h2>
        <ul className="list-disc space-y-3 pl-6">
          <li>
            <strong className="text-foreground">Venue owners</strong> — register a business account,
            add your venue, then publish events, tickets, and VIP packages.
          </li>
          <li>
            <strong className="text-foreground">Promoters</strong> — register as a promoter,
            request access to partner venues, then submit events and table or VIP offers.
          </li>
          <li>
            <strong className="text-foreground">Drivers</strong> — register your company, complete
            onboarding, and list your services for nights out.
          </li>
        </ul>
        <p>
          Start on our{" "}
          <Link href="/for-business" className="text-foreground underline">
            For Business
          </Link>{" "}
          page or{" "}
          <a href={registerUrl} className="text-foreground underline">
            create an account in the business portal
          </a>
          .
        </p>

        <p>
          Questions? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </PageShell>
  );
}

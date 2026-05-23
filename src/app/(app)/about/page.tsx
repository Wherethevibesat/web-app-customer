import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function AboutPage() {
  return (
    <PageShell
      title="About Where The Vibes At"
      subtitle="Connecting people to nightlife, events, and the energy of their city"
      width="narrow"
    >
      <div className="prose prose-invert max-w-none space-y-6 text-wtva-muted leading-relaxed">
        <p>
          WTVA helps you discover what&apos;s happening tonight — from club nights and
          parties to VIP experiences at the best venues in town.
        </p>
        <p>
          Check in when you go out, earn points, and climb the city leaderboard. Venue
          owners use our business tools to promote events, book talent, and grow their
          crowd.
        </p>
        <h2 className="text-xl font-bold text-foreground">Our platforms</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-foreground">Web</strong> — browse events and venues from any browser
          </li>
          <li>
            <strong className="text-foreground">Mobile app</strong> — full social, messaging, and VIP checkout
          </li>
          <li>
            <strong className="text-foreground">Business portal</strong> — venue owners manage listings and bookings
          </li>
        </ul>
        <p>
          Questions? Visit our{" "}
          <Link href="/help" className="text-foreground underline">
            help center
          </Link>{" "}
          or email{" "}
          <a href="mailto:support@wherethevibesat.com" className="text-foreground underline">
            support@wherethevibesat.com
          </a>
          .
        </p>
      </div>
    </PageShell>
  );
}

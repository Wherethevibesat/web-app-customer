import Link from "next/link";
import { headers } from "next/headers";
import { PageShell } from "@/components/page-shell";
import { getBusinessPortalBaseUrl } from "@/lib/business-portal-url";

const FAQ = [
  {
    q: "How do I earn ranking points?",
    a: "Check in at a venue while signed in. Each check-in awards +25 points toward your city leaderboard tier.",
  },
  {
    q: "How do I find events near me?",
    a: "Browse the Events page, use search, or explore venues by neighborhood. Featured events appear on the homepage.",
  },
  {
    q: "Can I buy VIP packages on the web?",
    a: "Yes. Sign in on the web app, open an event with VIP packages, and complete checkout with card. Paid event tickets and driver bookings also support web checkout.",
  },
  {
    q: "I'm a venue owner — where do I sign up?",
    a: "Use the business portal to manage your venue, talent, and promotions, or the mobile app for full onboarding.",
  },
];

export default async function HelpPage() {
  const host = (await headers()).get("host");
  const businessUrl = getBusinessPortalBaseUrl(host);

  return (
    <PageShell
      title="Help & support"
      subtitle="Answers to common questions and how to reach us"
      width="wide"
    >
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-wtva-dark-300 bg-wtva-card px-5 py-4"
            >
              <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                {item.q}
                <span className="text-wtva-muted group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-wtva-muted leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-6">
            <h2 className="font-semibold">Contact</h2>
            <p className="mt-3 text-sm text-wtva-muted">
              Email us at{" "}
              <a href="mailto:support@wherethevibesat.com" className="text-foreground underline">
                support@wherethevibesat.com
              </a>
            </p>
          </div>
          <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-6 text-sm">
            <h2 className="font-semibold">Quick links</h2>
            <ul className="mt-3 space-y-2 text-wtva-muted">
              <li>
                <Link href="/auth/register" className="hover:text-foreground">
                  Create account
                </Link>
              </li>
              <li>
                <a href={businessUrl} className="hover:text-foreground">
                  Business portal
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of use
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

import Link from "next/link";
import { PageShell } from "@/components/page-shell";

const SUPPORT_EMAIL = "business@wherethevibesat.com";

export default function SupportPage() {
  return (
    <PageShell
      title="Support"
      subtitle="We’re here to help with your account, bookings, and the app."
      width="narrow"
    >
      <div className="space-y-6 text-sm text-wtva-muted leading-relaxed">
        <p>
          Need help with Where The Vibes At? Email us and we’ll get back to you as soon as we
          can—usually within one to two business days.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            Email:{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="underline text-foreground font-medium"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="mt-3">
            Include your account email, city, and a short description of the issue. Screenshots
            help if something looks wrong in the app or on the website.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">What we can help with</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Account sign-in and profile questions</li>
            <li>Vibe bookings, My Plans, and payments</li>
            <li>Event tickets and venue listings</li>
            <li>App Store / mobile app issues</li>
            <li>Venue or business partnership questions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">More resources</h2>
          <ul className="mt-2 space-y-2">
            <li>
              <Link href="/help" className="underline text-foreground">
                Help & FAQ
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="underline text-foreground">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="underline text-foreground">
                Terms of use
              </Link>
            </li>
            <li>
              <Link href="/copyright" className="underline text-foreground">
                Copyright
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

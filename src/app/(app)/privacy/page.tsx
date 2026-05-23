import { PageShell } from "@/components/page-shell";

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy policy" subtitle="Last updated May 2026" width="narrow">
      <div className="space-y-6 text-sm text-wtva-muted leading-relaxed">
        <p>
          Where The Vibes At (&quot;WTVA&quot;) respects your privacy. This policy describes how we
          collect, use, and protect information when you use our website and mobile applications.
        </p>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
          <p className="mt-2">
            Account information (name, email), check-in activity, favorites, ranking points,
            and usage data necessary to operate the service.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
          <p className="mt-2">
            To provide event discovery, venue check-ins, leaderboards, and communications
            you opt into. We do not sell personal information to third parties.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            Privacy requests:{" "}
            <a href="mailto:privacy@wherethevibesat.com" className="underline text-foreground">
              privacy@wherethevibesat.com
            </a>
          </p>
        </section>
      </div>
    </PageShell>
  );
}

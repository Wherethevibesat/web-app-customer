import { PageShell } from "@/components/page-shell";

export default function TermsPage() {
  return (
    <PageShell title="Terms of use" subtitle="Last updated May 2026" width="narrow">
      <div className="space-y-6 text-sm text-wtva-muted leading-relaxed">
        <p>
          By using Where The Vibes At, you agree to these terms. If you do not agree, please
          do not use the service.
        </p>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
          <p className="mt-2">
            You are responsible for your account credentials and activity. You must provide
            accurate information when registering.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Content & conduct</h2>
          <p className="mt-2">
            Do not misuse the platform, harass others, or post unlawful content. We may
            suspend accounts that violate these rules.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Events & venues</h2>
          <p className="mt-2">
            Listings are provided by venues and partners. WTVA does not guarantee
            admission, pricing, or event changes — always confirm with the venue.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            <a href="mailto:legal@wherethevibesat.com" className="underline text-foreground">
              legal@wherethevibesat.com
            </a>
          </p>
        </section>
      </div>
    </PageShell>
  );
}

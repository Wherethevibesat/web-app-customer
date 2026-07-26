import Link from "next/link";
import { PageShell } from "@/components/page-shell";

const SUPPORT_EMAIL = "business@wherethevibesat.com";
const LEGAL_EMAIL = "legal@wherethevibesat.com";

export default function CopyrightPage() {
  const year = new Date().getFullYear();

  return (
    <PageShell
      title="Copyright"
      subtitle={`© ${year} Where The Vibes At. All rights reserved.`}
      width="narrow"
    >
      <div className="space-y-6 text-sm text-wtva-muted leading-relaxed">
        <p>
          The Where The Vibes At name, logos, website, mobile applications, and related content
          are owned by Where The Vibes At (&quot;WTVA&quot;) or its licensors. All rights reserved.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Our content</h2>
          <p className="mt-2">
            You may not copy, modify, distribute, sell, or create derivative works from WTVA
            branding, software, or materials without our prior written permission, except as
            allowed by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Third-party content</h2>
          <p className="mt-2">
            Event listings, venue photos, names, and other materials may belong to venues,
            promoters, or other partners. Those rights remain with their respective owners.
            WTVA does not claim ownership of partner-provided content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Trademarks</h2>
          <p className="mt-2">
            &quot;Where The Vibes At,&quot; &quot;WTVA,&quot; and related marks are trademarks of
            Where The Vibes At. Other names and logos appearing on the service may be trademarks
            of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Copyright concerns</h2>
          <p className="mt-2">
            If you believe content on WTVA infringes your copyright, email{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-foreground">
              {LEGAL_EMAIL}
            </a>{" "}
            with details of the work, the URL or location of the material, and your contact
            information. For general support, contact{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-foreground">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Related</h2>
          <ul className="mt-2 space-y-2">
            <li>
              <Link href="/terms" className="underline text-foreground">
                Terms of use
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="underline text-foreground">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/support" className="underline text-foreground">
                Support
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

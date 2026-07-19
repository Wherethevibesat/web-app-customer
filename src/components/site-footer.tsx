import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-wtva-dark-300 bg-wtva-dark-400">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/brand/wtva-logo.jpg"
              alt="Where The Vibes At"
              width={1024}
              height={493}
              className="h-10 w-auto mix-blend-multiply"
            />
            <p className="mt-3 text-sm text-wtva-muted">
              Find tonight&apos;s events, clubs, and experiences in your city.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-wtva-muted">
              <li><Link href="/events" className="hover:text-foreground">Events</Link></li>
              <li><Link href="/venues" className="hover:text-foreground">Venues</Link></li>
              <li><Link href="/map" className="hover:text-foreground">Map & areas</Link></li>
              <li><Link href="/search" className="hover:text-foreground">Search</Link></li>
              <li><Link href="/ranking" className="hover:text-foreground">Rankings</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-wtva-muted">
              <li><Link href="/auth/login" className="hover:text-foreground">Sign in</Link></li>
              <li><Link href="/auth/register" className="hover:text-foreground">Create account</Link></li>
              <li><Link href="/check-in" className="hover:text-foreground">Check in</Link></li>
              <li><Link href="/profile" className="hover:text-foreground">Profile</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-wtva-muted">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/help" className="hover:text-foreground">Help</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
              <li>
                <Link href="/for-business" className="hover:text-foreground">
                  For business
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-wtva-dark-300 pt-6 text-center text-xs text-wtva-subtle">
          © {new Date().getFullYear()} Where The Vibes At. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

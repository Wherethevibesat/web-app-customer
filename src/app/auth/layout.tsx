import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-wtva-dark-300 px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Where The Vibes At — home">
            <Image
              src="/brand/wtva-logo.jpg"
              alt="Where The Vibes At"
              width={1024}
              height={493}
              priority
              className="h-9 w-auto mix-blend-multiply lg:h-10"
            />
          </Link>
          <Link href="/events" className="text-sm text-wtva-muted hover:text-foreground">
            Browse events
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col justify-center py-12">{children}</main>
      <footer className="border-t border-wtva-dark-300 py-6 text-center text-xs text-wtva-subtle">
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        {" · "}
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        {" · "}
        <Link href="/help" className="hover:text-foreground">
          Help
        </Link>
      </footer>
    </div>
  );
}

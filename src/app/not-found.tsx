import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-wtva-muted">
        This page doesn&apos;t exist or may have moved. Head back to discover events and venues.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background"
        >
          Home
        </Link>
        <Link
          href="/events"
          className="rounded-lg border border-wtva-dark-300 px-6 py-3 text-sm font-semibold"
        >
          Events
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/discover", label: "Discover" },
  { href: "/discover/events", label: "Events" },
  { href: "/venues", label: "Venues" },
  { href: "/discover/map", label: "Map" },
  { href: "/ranking", label: "Rankings" },
  { href: "/for-business", label: "For Business" },
];

function isActive(pathname: string, href: string) {
  if (href === "/for-business") {
    return pathname === "/for-business" || pathname.startsWith("/for-business/");
  }
  if (href === "/discover") {
    return pathname === "/" || pathname === "/discover" || pathname.startsWith("/discover/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  isSignedIn,
  userName,
}: {
  isSignedIn: boolean;
  userName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/discover/search?${params.toString()}`);
    setMenuOpen(false);
  }

  const authLinks = isSignedIn ? (
    <>
      <Link
        href="/check-in"
        className="hidden rounded-lg border border-wtva-dark-300 px-3 py-2 text-sm font-medium hover:border-foreground sm:inline-flex"
      >
        Check in
      </Link>
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
      >
        <User className="h-4 w-4" />
        <span className="max-w-[120px] truncate">{userName}</span>
      </Link>
    </>
  ) : (
    <>
      <Link
        href="/auth/login"
        className="rounded-lg border border-wtva-dark-300 px-3 py-2 text-sm font-medium hover:border-foreground"
      >
        Sign in
      </Link>
      <Link
        href="/auth/register"
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
      >
        Join free
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-wtva-dark-300 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-8">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight lg:text-xl">
          Where The Vibes At
        </Link>

        <form onSubmit={onSearch} className="hidden flex-1 max-w-xl md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wtva-subtle" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events, venues, neighborhoods…"
              className="w-full rounded-full border border-wtva-dark-300 bg-wtva-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-foreground"
            />
          </div>
        </form>

        <nav className="hidden items-center gap-1 xl:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, href)
                  ? "bg-foreground text-background"
                  : "text-wtva-muted hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">{authLinks}</div>

        <button
          type="button"
          className="rounded-lg p-2 text-wtva-muted hover:bg-wtva-dark-300 xl:ml-0 xl:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-wtva-dark-300 px-4 py-4 xl:hidden">
          <form onSubmit={onSearch} className="mb-4">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events & venues…"
              className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
            />
          </form>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive(pathname, href) ? "bg-foreground text-background" : "text-wtva-muted",
                )}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-wtva-dark-300 pt-3">
              {isSignedIn ? (
                <>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm">
                    Profile
                  </Link>
                  <Link href="/check-in" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm">
                    Check in
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg border border-wtva-dark-300 px-3 py-2.5 text-center text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg bg-foreground px-3 py-2.5 text-center text-sm font-semibold text-background"
                  >
                    Join free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

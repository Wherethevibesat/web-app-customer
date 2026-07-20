"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, Menu, X, User, ChevronDown, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/lib/button";

const NAV = [
  { href: "/discover", label: "Discover" },
  { href: "/discover/concierge", label: "Concierge" },
  { href: "/discover/events", label: "Events" },
  { href: "/venues", label: "Venues" },
  { href: "/promoters", label: "Promoters" },
  { href: "/drivers", label: "Find Driver" },
  { href: "/discover/map", label: "Map" },
  { href: "/for-business", label: "For Business" },
];

function isActive(pathname: string, href: string) {
  if (href === "/for-business") {
    return pathname === "/for-business" || pathname.startsWith("/for-business/");
  }
  if (href === "/drivers") {
    return pathname === "/drivers" || pathname.startsWith("/drivers/");
  }
  if (href === "/promoters") {
    return pathname === "/promoters" || pathname.startsWith("/promoters/");
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
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/discover/search?${params.toString()}`);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  const authLinks = isSignedIn ? (
    <>
      <Link
        href="/check-in"
        className={buttonClass("secondary", "sm", "hidden sm:inline-flex")}
      >
        Check in
      </Link>
      <div className="relative" ref={accountRef}>
        <button
          type="button"
          onClick={() => setAccountOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          className={buttonClass("primary", "sm")}
        >
          <User className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{userName}</span>
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", accountOpen && "rotate-180")}
          />
        </button>
        {accountOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-wtva-dark-300 bg-white text-left shadow-card">
            <div className="border-b border-wtva-dark-300 px-4 py-3">
              <p className="text-xs text-wtva-muted">Signed in as</p>
              <p className="truncate text-sm font-semibold">{userName}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setAccountOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-wtva-dark-400"
            >
              <User className="h-4 w-4 text-wtva-subtle" />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setAccountOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-wtva-dark-400"
            >
              <Settings className="h-4 w-4 text-wtva-subtle" />
              Settings
            </Link>
            <form action="/auth/signout" method="post" className="border-t border-wtva-dark-300">
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  ) : (
    <>
      <Link href="/auth/login" className={buttonClass("secondary", "md")}>
        Log in
      </Link>
      <Link href="/auth/register" className={buttonClass("primary", "md")}>
        Sign up
      </Link>
    </>
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-wtva-dark-300 bg-white shadow-sm"
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 lg:h-[4.25rem] lg:px-8">
        <Link href="/" className="relative z-10 flex shrink-0 items-center" aria-label="Where The Vibes At — home">
          <Image
            src="/brand/wtva-logo.jpg"
            alt="Where The Vibes At"
            width={1024}
            height={493}
            priority
            className="h-14 w-auto mix-blend-multiply lg:h-16"
          />
        </Link>

        <nav className="absolute inset-x-0 hidden items-center justify-center gap-0.5 xl:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[15px] font-bold transition-colors",
                isActive(pathname, href)
                  ? "text-accent"
                  : "text-foreground/80 hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className={cn(
              "inline-flex rounded-full p-2.5 transition-colors",
              searchOpen
                ? "bg-accent/10 text-accent"
                : "text-wtva-muted hover:bg-wtva-dark-300 hover:text-foreground",
            )}
          >
            <Search className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 sm:flex">{authLinks}</div>
          <button
            type="button"
            className="rounded-lg p-2 text-wtva-muted hover:bg-wtva-dark-300 xl:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-wtva-dark-300 bg-white px-4 py-3 lg:px-8">
          <form
            onSubmit={onSearch}
            className="mx-auto flex max-w-7xl items-center gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wtva-subtle" />
              <input
                autoFocus
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search events, venues, neighborhoods…"
                className="w-full rounded-full border border-wtva-dark-300 bg-wtva-dark-400 py-3 pl-11 pr-4 text-sm outline-none focus:border-accent focus:bg-white"
              />
            </div>
            <button type="submit" className={buttonClass("primary", "md", "shrink-0")}>
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="inline-flex shrink-0 rounded-full p-2.5 text-wtva-muted transition-colors hover:bg-wtva-dark-300 hover:text-foreground"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

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
                  "rounded-lg px-3 py-2.5 text-sm font-semibold",
                  isActive(pathname, href) ? "text-accent" : "text-wtva-muted",
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
                  <Link href="/settings" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm">
                    Settings
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className={buttonClass("secondary", "md", "w-full")}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className={buttonClass("primary", "md", "w-full")}
                  >
                    Sign up
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

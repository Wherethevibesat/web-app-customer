"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/favorites", label: "Favorites" },
  { href: "/check-in", label: "Check in" },
  { href: "/messages", label: "Messages" },
  { href: "/settings", label: "Settings" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-wtva-dark-300 pb-4">
      {links.map(({ href, label }) => {
        const active =
          href === "/profile"
            ? pathname === "/profile"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium",
              active
                ? "bg-foreground text-background"
                : "text-wtva-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

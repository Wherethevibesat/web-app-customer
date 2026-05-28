"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Building2, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/discover", label: "Discover", icon: Home },
  { href: "/discover/events", label: "Events", icon: Calendar },
  { href: "/discover/concierge", label: "Concierge", icon: Sparkles },
  { href: "/venues", label: "Venues", icon: Building2 },
  { href: "/profile", label: "You", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-wtva-dark-300 bg-wtva-dark-400/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg justify-around px-1 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/discover"
              ? pathname === "/discover" || pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
                active ? "text-foreground" : "text-wtva-muted",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

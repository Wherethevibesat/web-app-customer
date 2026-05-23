import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  children,
  className,
  width = "default",
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
  width?: "default" | "narrow" | "wide";
}) {
  const max =
    width === "narrow"
      ? "max-w-xl"
      : width === "wide"
        ? "max-w-7xl"
        : "max-w-4xl";

  return (
    <div className={cn("mx-auto px-4 py-10 lg:px-8 lg:py-14", max, className)}>
      {backHref && (
        <Link href={backHref} className="text-sm text-wtva-muted hover:text-foreground">
          ← {backLabel}
        </Link>
      )}
      <header className={backHref ? "mt-4" : ""}>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-wtva-muted">{subtitle}</p>}
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}

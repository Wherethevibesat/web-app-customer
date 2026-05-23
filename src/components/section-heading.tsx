import Link from "next/link";

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "View all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-wtva-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="text-sm font-semibold text-wtva-muted hover:text-foreground"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

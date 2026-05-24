import Link from "next/link";
import Image from "next/image";
import { Megaphone } from "lucide-react";
import type { PromoterBrowseRow } from "@/lib/data/promoters";
import { promoterPublicPath } from "@/lib/promoter-slug";

export function PromoterBrowseCard({ promoter }: { promoter: PromoterBrowseRow }) {
  const href = promoterPublicPath(promoter);

  return (
    <Link
      href={href}
      className="flex flex-col rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 transition-colors hover:border-wtva-muted"
    >
      <div className="flex items-start gap-3">
        {promoter.profile_image_url ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={promoter.profile_image_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-wtva-dark-300">
            <Megaphone className="h-5 w-5 text-foreground" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{promoter.display_name}</h3>
          {promoter.offer_count > 0 && (
            <p className="mt-0.5 text-xs text-wtva-muted">
              {promoter.offer_count} active offer{promoter.offer_count === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>

      {promoter.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-wtva-muted">{promoter.bio}</p>
      )}

      {promoter.venues.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-wtva-subtle">
            Venues
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {promoter.venues.slice(0, 4).map((v) => (
              <li
                key={v.id}
                className="rounded-full border border-wtva-dark-300 px-2.5 py-0.5 text-xs text-wtva-muted"
              >
                {v.name}
              </li>
            ))}
            {promoter.venues.length > 4 && (
              <li className="text-xs text-wtva-subtle">+{promoter.venues.length - 4} more</li>
            )}
          </ul>
        </div>
      )}
    </Link>
  );
}


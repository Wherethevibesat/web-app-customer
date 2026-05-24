import Link from "next/link";
import Image from "next/image";
import { Megaphone } from "lucide-react";
import type { PromoterProfilePublic } from "@/lib/data/promoters";
import { promoterPublicPath } from "@/lib/promoter-slug";

export function VenuePromoterCard({ promoter }: { promoter: PromoterProfilePublic }) {
  return (
    <Link
      href={promoterPublicPath(promoter)}
      className="flex items-start gap-4 rounded-xl border border-wtva-dark-300 bg-wtva-card p-4 transition-colors hover:border-wtva-muted"
    >
      {promoter.profile_image_url ? (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-wtva-dark-300">
          <Image
            src={promoter.profile_image_url}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-wtva-dark-300 bg-wtva-dark-400">
          <Megaphone className="h-6 w-6 text-foreground" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{promoter.display_name}</p>
        {promoter.bio ? (
          <p className="mt-1 line-clamp-2 text-sm text-wtva-muted">{promoter.bio}</p>
        ) : (
          <p className="mt-1 text-sm text-wtva-muted">View promoter profile</p>
        )}
      </div>
    </Link>
  );
}

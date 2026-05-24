import { openingHoursRows } from "@/lib/types/opening-hours";
import type { Venue } from "@/lib/data/venues";

const SOCIAL_LINKS = [
  { key: "website_url" as const, label: "Website" },
  { key: "instagram_url" as const, label: "Instagram" },
  { key: "facebook_url" as const, label: "Facebook" },
  { key: "tiktok_url" as const, label: "TikTok" },
  { key: "twitter_url" as const, label: "X" },
];

export function VenueDetailsExtra({ venue }: { venue: Venue }) {
  const hours = openingHoursRows(venue.opening_hours);
  const links = SOCIAL_LINKS.filter((item) => venue[item.key]?.trim());

  if (!venue.hours_label && hours.length === 0 && links.length === 0) return null;

  return (
    <div className="mt-8 space-y-8">
      {(venue.hours_label || hours.some((h) => h.label !== "Closed")) && (
        <section>
          <h2 className="text-lg font-semibold">Hours</h2>
          {venue.hours_label && (
            <p className="mt-2 text-sm text-wtva-muted">{venue.hours_label}</p>
          )}
          {hours.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {hours.map((row) => (
                <li key={row.day} className="flex justify-between gap-4 border-b border-wtva-dark-300 py-2 last:border-0">
                  <span className="text-wtva-muted">{row.day}</span>
                  <span>{row.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {links.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Links</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {links.map((item) => {
              const href = venue[item.key]!;
              return (
                <li key={item.key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-medium hover:border-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

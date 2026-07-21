import { Building2, Car, Megaphone } from "lucide-react";
import { buttonClass } from "@/lib/button";

type HomeBusinessSectionProps = {
  venueRegisterUrl: string;
  promoterRegisterUrl: string;
  driverRegisterUrl: string;
};

const CARDS = [
  {
    id: "venues",
    title: "For Venues",
    description: "Get discovered, sell tickets & VIP, and prove who's in the room with check-in QR.",
    bullets: ["List your venue", "Sell tickets & VIP", "Validate rewards"],
    cta: "List your venue →",
    tone: "from-[#5b21b6]/90 to-[#9d174d]/85",
    icon: Building2,
  },
  {
    id: "promoters",
    title: "For Promoters",
    description: "Build your profile, partner with venues, and fill tables with inquire-to-book offers.",
    bullets: ["Public promoter profile", "Create events & offers", "Manage inquiries"],
    cta: "Become a promoter →",
    tone: "from-[#9a3412]/90 to-[#b45309]/85",
    icon: Megaphone,
  },
  {
    id: "drivers",
    title: "For Drivers",
    description: "List your fleet for nightlife nights and get paid when customers book packages.",
    bullets: ["Company listing", "Fleet packages", "Paid bookings"],
    cta: "List as a driver →",
    tone: "from-[#0f766e]/90 to-[#155e75]/85",
    icon: Car,
  },
] as const;

export function HomeBusinessSection({
  venueRegisterUrl,
  promoterRegisterUrl,
  driverRegisterUrl,
}: HomeBusinessSectionProps) {
  const hrefFor = (id: (typeof CARDS)[number]["id"]) => {
    if (id === "promoters") return promoterRegisterUrl;
    if (id === "drivers") return driverRegisterUrl;
    return venueRegisterUrl;
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">For businesses</h2>
        <p className="mt-1 text-wtva-muted">Grow your nightlife business with WTVA</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {CARDS.map(({ id, title, description, bullets, cta, tone, icon: Icon }) => (
          <article
            key={id}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tone} p-6 text-white shadow-card`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm text-white/85">{description}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-white/90">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {b}
                  </li>
                ))}
              </ul>
              <a
                href={hrefFor(id)}
                className={buttonClass(
                  "secondary",
                  "md",
                  "mt-6 bg-white text-foreground hover:bg-white/90 border-transparent",
                )}
              >
                {cta}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

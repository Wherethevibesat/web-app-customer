import { SiteFooter } from "@/components/site-footer";
import { SiteHeaderWrapper } from "@/components/site-header-wrapper";
import { MobileNav } from "@/components/mobile-nav";
import { ConciergeWidget } from "@/components/concierge-widget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeaderWrapper />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <ConciergeWidget />
      <MobileNav />
    </div>
  );
}

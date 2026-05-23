import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { PageShell } from "@/components/page-shell";
import { VenueCard } from "@/components/venue-card";
import { createClient } from "@/lib/supabase/server";
import { listFavorites } from "@/lib/data/favorites";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile/favorites");

  const favorites = await listFavorites(user.id).catch(() => []);

  return (
    <PageShell
      title="Saved venues"
      subtitle="Venues you've favorited for quick access"
      width="wide"
    >
      <AccountNav />
      {favorites.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-wtva-dark-300 py-16 text-center">
          <p className="text-wtva-muted">No saved venues yet.</p>
          <a href="/venues" className="mt-4 inline-block text-sm font-semibold underline">
            Explore venues
          </a>
        </div>
      )}
    </PageShell>
  );
}

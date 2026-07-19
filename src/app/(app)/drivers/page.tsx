import { DriverCompanyCard } from "@/components/driver-company-card";
import { listPublishedDrivers } from "@/lib/data/drivers";
import { buttonClass } from "@/lib/button";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const { q, city } = await searchParams;
  const drivers = await listPublishedDrivers({ search: q, city }).catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Find a driver</h1>
      <p className="mt-2 max-w-2xl text-wtva-muted">
        Book limo and VIP transport for your night out. Drivers set their own packages (hours + price).
      </p>

      <form className="mt-8 flex flex-col gap-3 sm:flex-row" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search company or city"
          className="flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
        <input
          name="city"
          defaultValue={city ?? ""}
          placeholder="City"
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm sm:w-48"
        />
        <button type="submit" className={buttonClass("primary", "lg")}>
          Search
        </button>
      </form>

      {drivers.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-wtva-dark-300 py-16 text-center text-wtva-muted">
          No drivers listed yet. Check back soon.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((company) => (
            <DriverCompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}

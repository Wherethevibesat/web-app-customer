import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DriverBookingSection } from "@/components/driver-booking-section";
import {
  getCustomerBookingsForCompany,
  getPublishedDriverCompany,
} from "@/lib/data/drivers";
import { getPublishableKey } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export default async function DriverDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string }>;
}) {
  const { id } = await params;
  const { booked } = await searchParams;
  const company = await getPublishedDriverCompany(id);
  if (!company) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [publishableKey, myBookings] = await Promise.all([
    getPublishableKey(),
    user ? getCustomerBookingsForCompany(user.id, id).catch(() => []) : Promise.resolve([]),
  ]);

  const allPackages = company.vehicles.flatMap((v) =>
    v.packages.map((p) => ({
      ...p,
      vehicle_name: v.name,
      vehicle_capacity: v.capacity,
    })),
  );

  return (
    <article>
      <div className="relative aspect-[21/9] max-h-[400px] w-full bg-wtva-dark-400">
        {company.image_url ? (
          <Image
            src={company.image_url}
            alt=""
            fill
            className="object-cover"
            unoptimized
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <Link href="/drivers" className="text-sm text-wtva-muted hover:text-foreground">
          ← All drivers
        </Link>

        <h1 className="mt-4 text-3xl font-bold md:text-4xl">{company.company_name}</h1>
        {company.city && <p className="mt-2 text-wtva-muted">{company.city}</p>}
        {company.description && (
          <p className="mt-6 leading-relaxed text-wtva-muted">{company.description}</p>
        )}

        {(company.contact_phone) && (
          <p className="mt-4 text-sm">
            <span className="text-wtva-muted">Contact:</span> {company.contact_phone}
          </p>
        )}

        {booked === "1" && (
          <p className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Payment received. The driver will review and accept or decline your booking.
          </p>
        )}

        {myBookings.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold">Your bookings</h2>
            <ul className="mt-3 space-y-2">
              {myBookings.map((b) => (
                <li
                  key={b.id}
                  className="rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
                >
                  <span className="font-medium capitalize">{b.status.replace("_", " ")}</span>
                  {" · "}
                  {new Date(b.scheduled_starts_at).toLocaleString()}
                  <br />
                  <span className="text-wtva-muted">Pickup: {b.pickup_address}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {company.vehicles.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold">Fleet</h2>
            <ul className="mt-4 space-y-4">
              {company.vehicles.map((v) => (
                <li
                  key={v.id}
                  className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5"
                >
                  <p className="font-semibold">{v.name}</p>
                  {v.capacity != null && (
                    <p className="text-sm text-wtva-muted">Up to {v.capacity} passengers</p>
                  )}
                  {v.description && (
                    <p className="mt-2 text-sm text-wtva-muted">{v.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <DriverBookingSection
          companyId={id}
          packages={allPackages}
          publishableKey={publishableKey}
          isSignedIn={!!user}
        />
      </div>
    </article>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export async function sendDriverBookingPaidNotifications(bookingId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("driver_bookings")
    .select(
      "pickup_address, dropoff_address, scheduled_starts_at, price_cents, customer:users!driver_bookings_customer_id_fkey(name, email), company:driver_companies(company_name, contact_email, owner:users!driver_companies_owner_id_fkey(name, email)), vehicle:driver_vehicles(name), package:driver_vehicle_packages(label)",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return;

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const company = Array.isArray(booking.company) ? booking.company[0] : booking.company;
  const vehicle = Array.isArray(booking.vehicle) ? booking.vehicle[0] : booking.vehicle;
  const pkg = Array.isArray(booking.package) ? booking.package[0] : booking.package;

  const customerEmail = (customer as { email: string } | null)?.email;
  if (!customerEmail) return;

  const companyRow = company as {
    company_name: string;
    contact_email: string | null;
    owner: { name: string; email: string } | { name: string; email: string }[] | null;
  } | null;
  const owner = companyRow?.owner
    ? Array.isArray(companyRow.owner)
      ? companyRow.owner[0]
      : companyRow.owner
    : null;
  const driverEmail = owner?.email ?? companyRow?.contact_email ?? null;

  const scheduledAt = formatDateTime(booking.scheduled_starts_at as string);
  const common = {
    companyName: companyRow?.company_name ?? "Driver",
    packageLabel: (pkg as { label: string } | null)?.label ?? "Ride",
    vehicleName: (vehicle as { name: string } | null)?.name ?? "Vehicle",
    pickupAddress: booking.pickup_address as string,
    dropoffAddress: booking.dropoff_address as string | null,
    scheduledAt,
    priceCents: booking.price_cents as number,
  };

  const { notifyCustomerBookingConfirmed, notifyDriverNewBooking } = await import(
    "@/lib/email/driver-notifications"
  );

  notifyCustomerBookingConfirmed({
    customerEmail,
    customerName: (customer as { name: string } | null)?.name ?? "",
    ...common,
  });

  if (driverEmail) {
    notifyDriverNewBooking({
      driverEmail,
      driverName: owner?.name ?? "",
      customerName: (customer as { name: string } | null)?.name ?? "",
      customerEmail,
      ...common,
    });
  }
}

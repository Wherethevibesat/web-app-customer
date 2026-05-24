import { createClient } from "@/lib/supabase/server";

export interface DriverCompany {
  id: string;
  company_name: string;
  description: string;
  city: string | null;
  image_url: string | null;
  contact_phone: string | null;
}

export interface DriverPackage {
  id: string;
  vehicle_id: string;
  label: string;
  duration_hours: number;
  price_cents: number;
  description: string;
  vehicle_name?: string;
  vehicle_capacity?: number | null;
}

export interface DriverCompanyDetail extends DriverCompany {
  vehicles: {
    id: string;
    name: string;
    description: string;
    capacity: number | null;
    image_urls: string[];
    packages: DriverPackage[];
  }[];
}

const COMPANY_SELECT =
  "id, company_name, description, city, image_url, contact_phone";

export async function listPublishedDrivers(options?: {
  search?: string;
  city?: string;
}): Promise<DriverCompany[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("driver_companies")
    .select(COMPANY_SELECT)
    .eq("published", true)
    .eq("status", "published")
    .order("company_name");

  if (error) return [];

  let rows = (data ?? []) as DriverCompany[];

  if (options?.city?.trim()) {
    const city = options.city.trim().toLowerCase();
    rows = rows.filter((c) => (c.city ?? "").toLowerCase().includes(city));
  }

  if (options?.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    rows = rows.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q),
    );
  }

  return rows;
}

export async function getPublishedDriverCompany(
  id: string,
): Promise<DriverCompanyDetail | null> {
  const supabase = await createClient();
  const { data: company, error } = await supabase
    .from("driver_companies")
    .select(COMPANY_SELECT)
    .eq("id", id)
    .eq("published", true)
    .eq("status", "published")
    .maybeSingle();

  if (error || !company) return null;

  const { data: vehicles } = await supabase
    .from("driver_vehicles")
    .select("id, name, description, capacity, image_urls, sort_order")
    .eq("company_id", id)
    .eq("is_active", true)
    .order("sort_order");

  const vehicleIds = (vehicles ?? []).map((v) => v.id as string);
  if (vehicleIds.length === 0) {
    return { ...(company as DriverCompany), vehicles: [] };
  }

  const { data: packages } = await supabase
    .from("driver_vehicle_packages")
    .select("id, vehicle_id, label, duration_hours, price_cents, description, sort_order")
    .in("vehicle_id", vehicleIds)
    .eq("is_active", true)
    .order("sort_order");

  const vehiclesWithPackages = (vehicles ?? []).map((v) => ({
    id: v.id as string,
    name: v.name as string,
    description: (v.description as string) ?? "",
    capacity: v.capacity as number | null,
    image_urls: (v.image_urls as string[]) ?? [],
    packages: (packages ?? [])
      .filter((p) => p.vehicle_id === v.id)
      .map((p) => ({
        id: p.id as string,
        vehicle_id: p.vehicle_id as string,
        label: p.label as string,
        duration_hours: Number(p.duration_hours),
        price_cents: p.price_cents as number,
        description: (p.description as string) ?? "",
        vehicle_name: v.name as string,
        vehicle_capacity: v.capacity as number | null,
      })),
  }));

  return {
    ...(company as DriverCompany),
    vehicles: vehiclesWithPackages.filter((v) => v.packages.length > 0),
  };
}

export async function getDriverPackageForBooking(packageId: string) {
  const supabase = await createClient();
  const { data: pkg, error } = await supabase
    .from("driver_vehicle_packages")
    .select("id, vehicle_id, label, duration_hours, price_cents, description, is_active")
    .eq("id", packageId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !pkg) return null;

  const { data: vehicle } = await supabase
    .from("driver_vehicles")
    .select("id, name, company_id, is_active")
    .eq("id", pkg.vehicle_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!vehicle) return null;

  const { data: company } = await supabase
    .from("driver_companies")
    .select("id, company_name, published, status, listing_expires_at")
    .eq("id", vehicle.company_id)
    .maybeSingle();

  if (!company?.published || company.status !== "published") return null;
  if (
    company.listing_expires_at &&
    new Date(company.listing_expires_at).getTime() <= Date.now()
  ) {
    return null;
  }

  return {
    id: pkg.id as string,
    vehicle_id: vehicle.id as string,
    company_id: vehicle.company_id as string,
    label: pkg.label as string,
    duration_hours: Number(pkg.duration_hours),
    price_cents: pkg.price_cents as number,
    description: (pkg.description as string) ?? "",
    vehicle_name: vehicle.name as string,
    company_name: company.company_name as string,
  };
}

export type CustomerDriverBooking = {
  id: string;
  status: string;
  pickup_address: string;
  scheduled_starts_at: string;
  price_cents: number;
  created_at: string;
};

export async function getCustomerBookingsForCompany(
  customerId: string,
  companyId: string,
): Promise<CustomerDriverBooking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("driver_bookings")
    .select("id, status, pickup_address, scheduled_starts_at, price_cents, created_at")
    .eq("customer_id", customerId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []) as CustomerDriverBooking[];
}

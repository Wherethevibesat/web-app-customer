import Link from "next/link";
import Image from "next/image";
import type { DriverCompany } from "@/lib/data/drivers";

export function DriverCompanyCard({ company }: { company: DriverCompany }) {
  return (
    <Link
      href={`/drivers/${company.id}`}
      className="block overflow-hidden rounded-xl border border-wtva-dark-300 bg-wtva-card transition-colors hover:border-wtva-muted"
    >
      <div className="relative aspect-[16/10] bg-wtva-dark-400">
        {company.image_url ? (
          <Image src={company.image_url} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-wtva-subtle">
            Driver / limo
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{company.company_name}</h3>
        <p className="mt-1 text-sm text-wtva-muted">{company.city ?? "City TBA"}</p>
        {company.description && (
          <p className="mt-2 line-clamp-2 text-sm text-wtva-subtle">{company.description}</p>
        )}
      </div>
    </Link>
  );
}

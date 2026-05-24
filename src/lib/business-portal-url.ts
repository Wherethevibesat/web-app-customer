export function getBusinessPortalUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_BUSINESS_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3002";
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

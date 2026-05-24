function normalizePath(path: string): string {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

/** Resolve business portal base URL (env → prod host → localhost). */
export function getBusinessPortalBaseUrl(siteHost?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_BUSINESS_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (siteUrl?.includes("wherethevibesat.com")) {
    return "https://business.wherethevibesat.com";
  }

  const host = siteHost?.split(":")[0]?.toLowerCase();
  if (host === "wherethevibesat.com" || host === "www.wherethevibesat.com") {
    return "https://business.wherethevibesat.com";
  }

  return "http://localhost:3002";
}

export function getBusinessPortalUrl(path = "", siteHost?: string | null): string {
  return `${getBusinessPortalBaseUrl(siteHost)}${normalizePath(path)}`;
}

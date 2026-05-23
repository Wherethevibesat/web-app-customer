import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const CONFIG_PATH = "/configuration-error";

const PUBLIC_PREFIXES = [
  "/",
  "/events",
  "/venues",
  "/search",
  "/map",
  "/neighborhoods",
  "/discover",
  "/about",
  "/privacy",
  "/terms",
  "/help",
  "/auth",
  "/configuration-error",
];

const PROTECTED_PREFIXES = ["/check-in", "/profile", "/ranking", "/messages", "/settings"];

function isPublicPath(path: string) {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function needsAuth(path: string) {
  return PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === CONFIG_PATH) {
    return NextResponse.next({ request });
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    if (path.startsWith("/auth") || path === "/") {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = CONFIG_PATH;
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    if (!needsAuth(path)) {
      await supabase.auth.getUser();
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    return response;
  } catch (err) {
    console.error("[customer middleware]", err);
    if (isPublicPath(path) || path.startsWith("/auth")) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = CONFIG_PATH;
    return NextResponse.redirect(url);
  }
}

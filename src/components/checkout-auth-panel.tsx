"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass } from "@/lib/button";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

/**
 * Modal login / sign-up for checkout — stays on the payment path after auth.
 */
export function CheckoutAuthPanel({
  title = "Sign in to finish booking",
  subtitle = "Create an account or log in to pay. We’ll bring you right back to checkout.",
  continueHref,
}: {
  title?: string;
  subtitle?: string;
  /** Full path (+ query) to stay on after auth. Defaults to current URL. */
  continueHref?: string;
}) {
  const router = useRouter();
  const titleId = useId();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resumeHref =
    continueHref ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function finishAuth() {
    // Replace keeps query params (party/stops/startsOn) and reloads RSC as signed-in.
    router.replace(resumeHref);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      await finishAuth();
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() || undefined, role: "customer" },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(resumeHref)}`
            : undefined,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data.session) {
      setError(
        "Account created — check your email to confirm, then sign in here to finish payment.",
      );
      setMode("login");
      return;
    }
    await finishAuth();
  }

  const inputClass =
    "w-full rounded-xl border border-wtva-dark-300 bg-wtva-dark-500 px-4 py-3 text-sm text-foreground placeholder:text-wtva-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-wtva-dark-300 bg-wtva-card shadow-2xl shadow-black/40"
      >
        <div className="bg-accent-gradient px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
            Almost there
          </p>
          <h3 id={titleId} className="mt-1 text-xl font-bold tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-sm text-white/85">{subtitle}</p>
        </div>

        <div className="p-5 md:p-6">
          <div
            role="tablist"
            aria-label="Account"
            className="inline-flex w-full rounded-full border border-wtva-dark-300 bg-wtva-dark-400 p-1"
          >
            {(
              [
                { id: "signup" as const, label: "Sign up" },
                { id: "login" as const, label: "Log in" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => {
                  setMode(tab.id);
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                  mode === tab.id
                    ? "bg-accent-gradient text-white shadow-accent"
                    : "text-wtva-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-wtva-muted">
                  Name
                </label>
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-wtva-muted">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-wtva-muted">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 6 characters"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className={buttonClass("primary", "lg", "w-full")}
            >
              {loading
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign in & continue to pay"
                  : "Create account & continue to pay"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-wtva-subtle">
            Your vibe plan stays right here after you sign in.
          </p>
        </div>
      </div>
    </div>
  );
}

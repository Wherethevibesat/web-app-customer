"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass } from "@/lib/button";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

/**
 * Stay-on-page login / sign-up for checkout — no redirect away from payment.
 */
export function CheckoutAuthPanel({
  title = "Sign in to pay",
  subtitle = "Create an account or sign in here to complete your booking — you won’t leave this page.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      router.refresh();
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() || undefined, role: "customer" } },
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
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm";

  return (
    <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-white via-white to-fuchsia-50/50 p-5 md:p-6">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-wtva-muted">{subtitle}</p>

      <div
        role="tablist"
        aria-label="Account"
        className="mt-5 inline-flex w-full rounded-full border border-wtva-dark-300 bg-wtva-card p-1"
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
              "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
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
            <label className="mb-1 block text-xs text-wtva-muted">Name</label>
            <input
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">Password</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
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
              ? "Sign in & continue to payment"
              : "Create account & continue to payment"}
        </button>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { BusinessAccountLinks } from "@/components/auth/business-account-links";
import { createClient } from "@/lib/supabase/client";
import { buttonClass } from "@/lib/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthCard title="Welcome back" subtitle="Customer sign in — check in, save favorites, and climb the ranks">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className={buttonClass("primary", "lg", "w-full")}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-wtva-muted">
        New here?{" "}
        <Link href="/auth/register" className="font-medium text-foreground underline">
          Create a free customer account
        </Link>
      </p>
      <BusinessAccountLinks />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

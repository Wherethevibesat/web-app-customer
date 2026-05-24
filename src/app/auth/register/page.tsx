"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { BusinessAccountLinks } from "@/components/auth/business-account-links";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
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
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: "customer" } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <AuthCard
      title="Join free"
      subtitle="Create a customer account to discover events, check in at venues, and earn points"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">Email</label>
          <input
            type="email"
            required
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create customer account"}
        </button>
      </form>
      <BusinessAccountLinks />
      <p className="mt-4 text-center text-xs text-wtva-subtle">
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="mt-4 text-center text-sm text-wtva-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-foreground underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save");
      return;
    }
    setMessage("Profile updated.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-6">
      <div>
        <label className="mb-1 block text-sm text-wtva-muted">Display name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-wtva-muted">Email</label>
        <input
          value={email}
          disabled
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-sm text-wtva-muted"
        />
        <p className="mt-1 text-xs text-wtva-subtle">Email changes are managed via Supabase auth.</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-400">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

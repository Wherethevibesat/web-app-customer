"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserHit = { id: string; name: string; email: string };

export function NewMessagePanel({ users }: { users: UserHit[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  async function startDm(otherUserId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/messages/${data.threadId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start chat");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
      <h3 className="font-semibold">New message</h3>
      <input
        type="search"
        placeholder="Search people…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-3 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {filtered.slice(0, 8).map((u) => (
          <li key={u.id}>
            <button
              type="button"
              disabled={loading}
              onClick={() => startDm(u.id)}
              className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-wtva-dark-400 disabled:opacity-50"
            >
              <span className="font-medium">{u.name}</span>
              <span className="ml-2 text-wtva-muted">{u.email}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-4 text-center text-sm text-wtva-muted">No matches</li>
        )}
      </ul>
    </div>
  );
}

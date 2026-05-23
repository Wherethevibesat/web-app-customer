import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { ChatThreadRow } from "@/lib/data/messages";

function threadTitle(t: ChatThreadRow): string {
  if (t.kind === "venue") return t.venue?.name ?? t.title ?? "Venue chat";
  return t.other_user?.name ?? "Direct message";
}

function threadHref(t: ChatThreadRow): string {
  return `/messages/${t.id}`;
}

export function ThreadList({ threads }: { threads: ChatThreadRow[] }) {
  if (threads.length === 0) {
    return (
      <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-10 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-wtva-subtle opacity-50" />
        <p className="mt-4 font-medium">No conversations yet</p>
        <p className="mt-2 text-sm text-wtva-muted">
          Start a DM or message a venue from their page.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-wtva-dark-300 rounded-xl border border-wtva-dark-300 bg-wtva-card overflow-hidden">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            href={threadHref(t)}
            className="flex items-center gap-4 px-4 py-4 hover:bg-wtva-dark-400 transition-colors"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wtva-dark-300 text-sm font-bold">
              {threadTitle(t).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold truncate">{threadTitle(t)}</p>
                {(t.unread ?? 0) > 0 && (
                  <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-xs font-bold text-background">
                    {t.unread}
                  </span>
                )}
              </div>
              {t.preview && (
                <p className="mt-0.5 truncate text-sm text-wtva-muted">{t.preview}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

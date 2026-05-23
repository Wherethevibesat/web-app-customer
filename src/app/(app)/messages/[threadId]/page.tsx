import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ChatPanel } from "@/components/chat-panel";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { listThreadMessages } from "@/lib/data/messages";
import type { ChatThreadRow } from "@/lib/data/messages";

function threadTitle(t: {
  kind: string;
  title: string | null;
  venue?: { name: string } | null;
  other_user?: { name: string } | null;
}): string {
  if (t.kind === "venue") return t.venue?.name ?? t.title ?? "Venue chat";
  return t.other_user?.name ?? "Direct message";
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/messages/${threadId}`);

  const { data: part } = await supabase
    .from("chat_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!part) notFound();

  const { data: thread, error } = await supabase
    .from("chat_threads")
    .select("id, kind, title, venue:venues(name)")
    .eq("id", threadId)
    .maybeSingle();
  if (error || !thread) notFound();

  let other_user: ChatThreadRow["other_user"] = null;
  if (thread.kind === "dm") {
    const { data: others } = await supabase
      .from("chat_participants")
      .select("user:users(id, name, profile_image_url)")
      .eq("thread_id", threadId)
      .neq("user_id", user.id)
      .limit(1);
    const u = others?.[0]?.user as
      | { id: string; name: string; profile_image_url: string | null }
      | { id: string; name: string; profile_image_url: string | null }[]
      | null;
    other_user = Array.isArray(u) ? u[0] ?? null : u;
  }

  const venue = thread.venue as { name: string } | { name: string }[] | null;
  const title = threadTitle({
    kind: thread.kind,
    title: thread.title,
    venue: Array.isArray(venue) ? venue[0] ?? null : venue,
    other_user,
  });

  let messages: Awaited<ReturnType<typeof listThreadMessages>> = [];
  try {
    messages = await listThreadMessages(threadId, user.id);
  } catch {
    notFound();
  }

  return (
    <PageShell title="Messages" width="wide">
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-sm text-wtva-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inbox
      </Link>
      <div className="mt-6 max-w-2xl">
        <ChatPanel
          threadId={threadId}
          title={title}
          initialMessages={messages}
          currentUserId={user.id}
        />
      </div>
    </PageShell>
  );
}

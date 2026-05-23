import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ChatThreadRow = {
  id: string;
  kind: string;
  venue_id: string | null;
  title: string | null;
  last_message_at: string;
  unread?: number;
  preview?: string;
  other_user?: { id: string; name: string; profile_image_url: string | null } | null;
  venue?: { id: string; name: string } | null;
};

export type ChatMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: { name: string; profile_image_url: string | null };
};

export async function listMyThreads(userId: string): Promise<ChatThreadRow[]> {
  const supabase = await createClient();
  const { data: parts, error } = await supabase
    .from("chat_participants")
    .select("thread_id, last_read_at")
    .eq("user_id", userId);
  if (error) throw error;
  if (!parts?.length) return [];

  const threadIds = parts.map((p) => p.thread_id);
  const { data: threads, error: tErr } = await supabase
    .from("chat_threads")
    .select("id, kind, venue_id, title, last_message_at, venue:venues(id, name)")
    .in("id", threadIds)
    .order("last_message_at", { ascending: false });
  if (tErr) throw tErr;

  const results: ChatThreadRow[] = [];
  for (const t of threads ?? []) {
    const part = parts.find((p) => p.thread_id === t.id);
    const { data: lastMsg } = await supabase
      .from("chat_messages")
      .select("body, created_at, sender_id")
      .eq("thread_id", t.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let unread = 0;
    if (lastMsg && part?.last_read_at) {
      if (new Date(lastMsg.created_at) > new Date(part.last_read_at)) {
        unread = lastMsg.sender_id !== userId ? 1 : 0;
      }
    } else if (lastMsg && lastMsg.sender_id !== userId) {
      unread = 1;
    }

    let other_user = null;
    if (t.kind === "dm") {
      const { data: others } = await supabase
        .from("chat_participants")
        .select("user:users(id, name, profile_image_url)")
        .eq("thread_id", t.id)
        .neq("user_id", userId)
        .limit(1);
      const u = others?.[0]?.user as
        | { id: string; name: string; profile_image_url: string | null }
        | { id: string; name: string; profile_image_url: string | null }[]
        | null;
      other_user = Array.isArray(u) ? u[0] ?? null : u;
    }

    const venue = t.venue as { id: string; name: string } | { id: string; name: string }[] | null;
    results.push({
      id: t.id,
      kind: t.kind,
      venue_id: t.venue_id,
      title: t.title,
      last_message_at: t.last_message_at,
      preview: lastMsg?.body,
      unread,
      other_user,
      venue: Array.isArray(venue) ? venue[0] ?? null : venue,
    });
  }
  return results;
}

export async function listThreadMessages(
  threadId: string,
  userId: string,
): Promise<ChatMessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, thread_id, sender_id, body, created_at, sender:users(name, profile_image_url)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  await supabase
    .from("chat_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("user_id", userId);

  return (data ?? []).map((m) => {
    const sender = m.sender as
      | { name: string; profile_image_url: string | null }
      | { name: string; profile_image_url: string | null }[]
      | null;
    return {
      ...m,
      sender: Array.isArray(sender) ? sender[0] ?? undefined : sender ?? undefined,
    };
  }) as ChatMessageRow[];
}

export async function findOrCreateDmThread(
  userId: string,
  otherUserId: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data: myParts } = await admin
    .from("chat_participants")
    .select("thread_id")
    .eq("user_id", userId);

  const myThreadIds = (myParts ?? []).map((p) => p.thread_id);
  if (myThreadIds.length) {
    const { data: shared } = await admin
      .from("chat_participants")
      .select("thread_id")
      .eq("user_id", otherUserId)
      .in("thread_id", myThreadIds);
    for (const s of shared ?? []) {
      const { data: thread } = await admin
        .from("chat_threads")
        .select("id, kind")
        .eq("id", s.thread_id)
        .eq("kind", "dm")
        .maybeSingle();
      if (thread) return thread.id;
    }
  }

  const { data: thread, error } = await admin
    .from("chat_threads")
    .insert({ kind: "dm" })
    .select("id")
    .single();
  if (error) throw error;

  await admin.from("chat_participants").insert([
    { thread_id: thread.id, user_id: userId },
    { thread_id: thread.id, user_id: otherUserId },
  ]);

  return thread.id as string;
}

export async function findOrCreateVenueThread(
  userId: string,
  venueId: string,
  venueName: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("chat_threads")
    .select("id")
    .eq("kind", "venue")
    .eq("venue_id", venueId)
    .limit(1)
    .maybeSingle();

  let threadId = existing?.id as string | undefined;
  if (!threadId) {
    const { data: thread, error } = await admin
      .from("chat_threads")
      .insert({ kind: "venue", venue_id: venueId, title: venueName })
      .select("id")
      .single();
    if (error) throw error;
    threadId = thread.id as string;
  }

  await admin.from("chat_participants").upsert(
    { thread_id: threadId, user_id: userId },
    { onConflict: "thread_id,user_id" },
  );

  const { data: venue } = await admin
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .maybeSingle();
  if (venue?.owner_id) {
    await admin.from("chat_participants").upsert(
      { thread_id: threadId, user_id: venue.owner_id },
      { onConflict: "thread_id,user_id" },
    );
  }

  return threadId;
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  body: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chat_messages")
    .insert({ thread_id: threadId, sender_id: senderId, body: body.trim() })
    .select("id")
    .single();
  if (error) throw error;

  await admin
    .from("chat_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  return data.id as string;
}

export async function searchCustomersForChat(
  query: string,
  excludeUserId: string,
): Promise<{ id: string; name: string; email: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("role", "customer")
    .neq("id", excludeUserId)
    .limit(20);
  if (error) throw error;
  const q = query.toLowerCase().trim();
  if (!q) return (data ?? []).slice(0, 10);
  return (data ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );
}

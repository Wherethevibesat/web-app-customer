import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/data/messages";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { threadId, body } = await request.json();
  if (!threadId || !body?.trim()) {
    return NextResponse.json({ error: "threadId and body required" }, { status: 400 });
  }

  const { data: part } = await supabase
    .from("chat_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const messageId = await sendMessage(threadId, user.id, body);
    return NextResponse.json({ messageId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

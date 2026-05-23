import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listThreadMessages } from "@/lib/data/messages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { data: part } = await supabase
    .from("chat_participants")
    .select("thread_id")
    .eq("thread_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const messages = await listThreadMessages(id, user.id);
    return NextResponse.json({ messages });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load messages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

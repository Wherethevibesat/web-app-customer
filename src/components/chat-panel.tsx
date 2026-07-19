"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessageRow } from "@/lib/data/messages";
import { buttonClass } from "@/lib/button";

type Props = {
  threadId: string;
  title: string;
  initialMessages: ChatMessageRow[];
  currentUserId: string;
};

export function ChatPanel({
  threadId,
  title,
  initialMessages,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/messages/threads/${threadId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body: text }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Send failed");
      }
      setBody("");
      await refresh();
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-wtva-dark-300 bg-wtva-card min-h-[480px]">
      <header className="border-b border-wtva-dark-300 px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[420px]">
        {messages.length === 0 && (
          <p className="text-center text-sm text-wtva-muted py-8">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-foreground text-background"
                    : "bg-wtva-dark-400 border border-wtva-dark-300"
                }`}
              >
                {!mine && m.sender?.name && (
                  <p className="text-xs font-semibold opacity-70 mb-0.5">{m.sender.name}</p>
                )}
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSend}
        className="border-t border-wtva-dark-300 p-4 flex gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className={buttonClass("primary", "sm")}
        >
          Send
        </button>
      </form>
    </div>
  );
}

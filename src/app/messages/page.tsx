"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MessageSquare, Send, User, Search, Loader2, ArrowLeft, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store/useUserStore";

interface Conversation {
  id: string;
  updated_at: string;
  otherUser?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const storeUserId = useUserStore((s) => s.user?.id);
  const currentUserId = storeUserId || null;
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !initialUserId) {
          setActiveConvId((prev) => prev || data.conversations[0].id);
        }
      }
    } finally {
      setLoadingConvs(false);
    }
  }, [initialUserId]);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setTimeout(scrollToBottom, 50);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConvId || undefined,
          recipient_id: initialUserId || undefined,
          content: messageInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setMessageInput("");
        if (!activeConvId && data.conversation_id) {
          setActiveConvId(data.conversation_id);
          loadConversations();
        }
        setTimeout(scrollToBottom, 50);
      }
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-background">
        {/* Under Development Banner Bar */}
        <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 dark:from-amber-500/20 dark:via-amber-500/25 dark:to-orange-500/20 border-b border-amber-500/30 px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300 shrink-0 select-none">
          <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500 shrink-0" />
          <span>Message part is under development... coming soon</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Split Left Panel: Conversation List (Hidden on mobile if a chat is active) */}
        <div
          className={`w-full sm:w-80 md:w-96 border-r border-border bg-card/60 flex flex-col overflow-hidden ${
            activeConvId ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-xs sm:text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary" />
              <span>Direct Messages</span>
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-1">
            {loadingConvs ? (
              <div className="p-6 sm:p-8 text-center text-xs text-muted-foreground">
                <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin mx-auto mb-2 text-primary" />
                <span>Loading chats...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-xs text-muted-foreground">
                <p>No conversations yet.</p>
                <p className="mt-1">Connect with developers from their profiles to chat.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === activeConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer flex items-center gap-2.5 sm:gap-3 transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <UserAvatar
                      src={c.otherUser?.avatar_url}
                      alt={c.otherUser?.full_name}
                      size="md"
                    />
                    <div className="flex-1 truncate">
                      <p className="text-[11px] sm:text-xs font-bold truncate">
                        {c.otherUser?.full_name || c.otherUser?.username || "Developer"}
                      </p>
                      <p className="text-[10px] sm:text-[11px] opacity-75 truncate">
                        @{c.otherUser?.username || "coder"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Thread & Composer */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-card ${
            !activeConvId && !initialUserId ? "hidden sm:flex" : "flex"
          }`}
        >
          {activeConvId || initialUserId ? (
            <>
              {/* Chat Header */}
              <div className="h-11 sm:h-14 px-3 sm:px-6 border-b border-border bg-card/80 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveConvId(null)}
                    className="sm:hidden p-1 -ml-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0">
                    {(activeConversation?.otherUser?.username || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-[150px] sm:max-w-none">
                      {activeConversation?.otherUser?.full_name || activeConversation?.otherUser?.username || "Developer"}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                      @{activeConversation?.otherUser?.username || "online"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-2 sm:space-y-3">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin text-primary mr-2" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Say hello to start the conversation!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-md px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs leading-relaxed ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-secondary text-foreground rounded-bl-xs"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 px-1">
                          {formatRelativeTime(m.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t border-border bg-card flex gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2.5 text-[11px] sm:text-xs rounded-lg sm:rounded-xl bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1 sm:gap-1.5 cursor-pointer"
                >
                  <Send className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 text-primary opacity-40" />
              <h3 className="text-base font-bold text-foreground">Select a conversation</h3>
              <p className="text-xs max-w-sm mt-1">
                Choose a chat from the left panel to begin messaging with other developers.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="h-full flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    }>
      <MessagesContent />
    </Suspense>
  );
}

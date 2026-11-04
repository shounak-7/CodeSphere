"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Trash2,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useToastStore } from "@/lib/store/useToastStore";
import { VerifiedBadge, isTeamAccount, isVerifiedAccount } from "@/components/ui/VerifiedBadge";
import { ScrollableNav } from "@/components/ui/ScrollableNav";
import { createClient } from "@/lib/supabase/client";

interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id?: string;
  actor?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  notification_type: "like" | "comment" | "follow";
  reference_id?: string;
  post_title?: string;
  comment_text?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "like" | "comment" | "follow">("all");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);

        // Automatically mark all as read once the user views notifications
        const hasUnread = data.notifications.some((n: NotificationItem) => !n.is_read);
        if (hasUnread) {
          fetch("/api/notifications", { method: "PUT" }).then(() => {
            window.dispatchEvent(new CustomEvent("notifications-updated"));
          });
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        channel = supabase
          .channel(`notifications-page-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${user.id}`,
            },
            () => {
              loadNotifications();
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    window.dispatchEvent(new CustomEvent("notifications-updated"));
    useToastStore.getState().addToast("All notifications marked as read", "info");
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        window.dispatchEvent(new CustomEvent("notifications-updated"));
        useToastStore.getState().addToast("Notification deleted", "info");
      }
    } catch {
      useToastStore.getState().addToast("Failed to delete notification", "error");
    }
  };

  const handleClearAll = () => {
    useToastStore.getState().openConfirm({
      title: "Delete All Notifications",
      message: "Are you sure you want to delete all notifications? This action cannot be undone.",
      confirmLabel: "Clear All",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/notifications?all=true", { method: "DELETE" });
          if (res.ok) {
            setNotifications([]);
            window.dispatchEvent(new CustomEvent("notifications-updated"));
            useToastStore.getState().addToast("All notifications deleted", "info");
          }
        } catch {
          useToastStore.getState().addToast("Failed to clear notifications", "error");
        }
      },
    });
  };

  const handleToggleFollow = async (username: string) => {
    const current = followingMap[username] || false;
    const nextVal = !current;
    setFollowingMap((prev) => ({ ...prev, [username]: nextVal }));

    try {
      const res = await fetch(`/api/profiles/${username}/follow`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setFollowingMap((prev) => ({ ...prev, [username]: data.following }));
        useToastStore.getState().addToast(
          data.following ? `Now following @${username}` : `Unfollowed @${username}`,
          "info"
        );
      } else {
        setFollowingMap((prev) => ({ ...prev, [username]: current }));
      }
    } catch {
      setFollowingMap((prev) => ({ ...prev, [username]: current }));
    }
  };

  const filtered = notifications.filter(
    (n) => filter === "all" || n.notification_type === filter
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-2.5 sm:px-6 py-3.5 sm:py-6 lg:py-8 space-y-3.5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-border">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs shrink-0">
              <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-bold text-foreground">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary text-primary-foreground shadow-xs animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
                Activity on your C programs, solutions, and profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary" />
                <span>Mark read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all cursor-pointer shadow-xs"
                title="Delete all notifications"
              >
                <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills with Left/Right Scrollable Navigation */}
        <div className="pb-0.5">
          <ScrollableNav className="gap-1.5 sm:gap-2">
            {[
              { id: "all", label: "All Activity", icon: Sparkles },
              { id: "like", label: "Likes", icon: Heart, color: "text-rose-500" },
              { id: "comment", label: "Comments", icon: MessageSquare, color: "text-violet-500" },
              { id: "follow", label: "Followers", icon: UserPlus, color: "text-blue-500" },
            ].map((tab) => {
              const Icon = tab.icon;
              const count =
                tab.id === "all"
                  ? notifications.length
                  : notifications.filter((n) => n.notification_type === tab.id).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    filter === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                >
                <Icon className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${filter === tab.id ? "text-white" : tab.color || ""}`} />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono ${
                      filter === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          </ScrollableNav>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-2.5 sm:space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-16 sm:h-20 rounded-xl sm:rounded-2xl bg-card border border-border animate-pulse p-3 sm:p-4 flex items-center gap-3"
              >
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-secondary shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/2 h-3 bg-secondary rounded" />
                  <div className="w-1/3 h-2 bg-secondary rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-8 sm:p-12 text-center text-muted-foreground shadow-xs">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-secondary mx-auto mb-2.5 sm:mb-3 flex items-center justify-center text-primary/40">
              <Bell className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">No notifications</h3>
            <p className="text-[11px] sm:text-xs max-w-sm mx-auto mt-1 leading-relaxed">
              When developers like your posts, comment on your C code, or follow your journey, updates will appear here!
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {filtered.map((n) => {
              const username = n.actor?.username || "developer";
              const isFollowingActor = followingMap[username] || false;

              return (
                <div
                  key={n.id}
                  className={`relative p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5 group hover:border-primary/40 ${
                    !n.is_read
                      ? "bg-primary/[0.04] dark:bg-primary/[0.07] border-primary/30 shadow-xs"
                      : "bg-card border-border/80 hover:bg-secondary/20"
                  }`}
                >
                  {/* Left: Avatar + Activity Text */}
                  <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                    {/* Left: Avatar with Type-Badge Overlaid */}
                    <div className="relative shrink-0 mt-0.5">
                      <Link href={`/profile/${username}`}>
                        <div className="hidden sm:block">
                          <UserAvatar
                            src={n.actor?.avatar_url}
                            alt={n.actor?.full_name || username}
                            size="md"
                            className="ring-2 ring-background group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="sm:hidden">
                          <UserAvatar
                            src={n.actor?.avatar_url}
                            alt={n.actor?.full_name || username}
                            size="sm"
                            className="ring-2 ring-background group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </Link>

                      {/* Micro-badge */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white ring-2 ring-card shadow-xs ${
                          n.notification_type === "like"
                            ? "bg-gradient-to-tr from-rose-500 to-pink-500"
                            : n.notification_type === "comment"
                            ? "bg-gradient-to-tr from-violet-600 to-indigo-600"
                            : "bg-gradient-to-tr from-blue-600 to-cyan-600"
                        }`}
                      >
                        {n.notification_type === "like" ? (
                          <Heart className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-white" />
                        ) : n.notification_type === "comment" ? (
                          <MessageSquare className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-white" />
                        ) : (
                          <UserPlus className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        )}
                      </div>
                    </div>

                    {/* Center: Activity Text */}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-xs sm:text-sm text-foreground leading-snug break-words">
                        <Link
                          href={`/profile/${username}`}
                          className="font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mr-1"
                        >
                          <span>@{username}</span>
                          {isVerifiedAccount(n.actor) && (
                            <VerifiedBadge size="sm" isTeam={isTeamAccount(username)} />
                          )}
                        </Link>

                        {n.notification_type === "like" && (
                          <span className="text-muted-foreground">
                            liked your C algorithm post{" "}
                            {n.post_title && (
                              <span className="font-semibold text-foreground italic">
                                &quot;{n.post_title}&quot;
                              </span>
                            )}
                          </span>
                        )}

                        {n.notification_type === "comment" && (
                          <span className="text-muted-foreground">
                            {n.comment_text ? (
                              <>
                                commented:{" "}
                                <span className="font-semibold text-primary">
                                  &quot;{n.comment_text}&quot;
                                </span>
                              </>
                            ) : (
                              <>
                                commented on your C post{" "}
                                {n.post_title && (
                                  <span className="font-semibold text-foreground italic">
                                    &quot;{n.post_title}&quot;
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                        )}

                        {n.notification_type === "follow" && (
                          <span className="text-muted-foreground">started following your developer profile.</span>
                        )}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
                        <span>{formatRelativeTime(n.created_at)}</span>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions area: indented to align with text on mobile (pl-[38px]); on desktop (sm:pl-0), clean right column */}
                  <div className="flex items-center justify-start sm:justify-end gap-1.5 sm:gap-2 pl-[38px] sm:pl-0 shrink-0">
                    {n.notification_type === "follow" ? (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(username)}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isFollowingActor
                            ? "bg-secondary text-foreground hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 border border-border"
                            : "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20"
                        }`}
                      >
                        {isFollowingActor ? (
                          <>
                            <UserCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            <span>Follow Back</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/feed#post-${n.reference_id || ""}`}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground border border-border transition-colors shadow-2xs"
                      >
                        <span>View</span>
                        <ExternalLink className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-muted-foreground" />
                      </Link>
                    )}

                    {/* Delete notification button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="p-1 sm:p-1.5 rounded-md sm:rounded-lg text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

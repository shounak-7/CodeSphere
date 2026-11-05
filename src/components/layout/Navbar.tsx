"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Terminal,
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  User,
  LogOut,
  Settings,
  Bookmark,
  Code2,
  Menu,
  Heart,
  MessageSquare,
  UserPlus,
  Check,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatRelativeTime } from "@/lib/utils";
import { VerifiedBadge, isTeamAccount, isVerifiedAccount } from "@/components/ui/VerifiedBadge";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id?: string;
  actor?: {
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
  notification_type: "like" | "comment" | "follow";
  reference_id?: string;
  post_title?: string;
  comment_text?: string;
  is_read: boolean;
  created_at: string;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const user = useUserStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const isInitialNotifLoadRef = useRef(true);
  const knownNotifIdsRef = useRef<Set<string>>(new Set());

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const notifyUserOfEvent = (notification: {
    notification_type: string;
    actor?: { username?: string; full_name?: string };
  }) => {
    const actorName =
      notification.actor?.full_name ||
      (notification.actor?.username ? `@${notification.actor.username}` : "Someone");

    if (notification.notification_type === "like") {
      useToastStore.getState().addToast(`❤️ ${actorName} liked your post!`, "info");
    } else if (notification.notification_type === "comment") {
      useToastStore.getState().addToast(`💬 ${actorName} commented on your post!`, "info");
    } else if (notification.notification_type === "follow") {
      useToastStore.getState().addToast(`👤 ${actorName} started following you!`, "info");
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    if (!userRef.current) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        const notifs = data.notifications as NotificationItem[];
        setNotifications(notifs);
        const unread = notifs.filter((n: NotificationItem) => !n.is_read).length;
        setUnreadCount(unread);

        // Display pop-up toasts for newly received unread notifications
        if (!isInitialNotifLoadRef.current) {
          const freshNotifs = notifs.filter((n) => !n.is_read && !knownNotifIdsRef.current.has(n.id));
          for (const n of freshNotifs) {
            notifyUserOfEvent(n);
          }
        }

        notifs.forEach((n) => knownNotifIdsRef.current.add(n.id));
        isInitialNotifLoadRef.current = false;
      }
    } catch {
      // Ignore
    }
  }, []);

  // Initialize global auth store
  useEffect(() => {
    const cleanupAuth = useUserStore.getState().initialize();
    return () => {
      cleanupAuth();
    };
  }, []);

  // Real-time notifications and background listener setup
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on("broadcast", { event: "new_notification" }, (payload) => {
        if (payload?.payload) {
          notifyUserOfEvent(payload.payload);
          fetchNotifications();
        }
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const handleProfileUpdated = () => {
      useUserStore.getState().refreshProfile();
    };

    const handleNotifUpdated = () => {
      fetchNotifications();
    };

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdated);
    window.addEventListener("notifications-updated", handleNotifUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdated);
      window.removeEventListener("notifications-updated", handleNotifUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Click outside and escape listeners for dropdowns
  useEffect(() => {

    // Click outside listener to prevent dropdowns from remaining stuck on main screen
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        notifRef.current &&
        !notifRef.current.contains(target) &&
        (!notifDropdownRef.current || !notifDropdownRef.current.contains(target))
      ) {
        setShowNotifMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setShowThemeMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNotifMenu(false);
        setShowUserMenu(false);
        setShowThemeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // When visiting the notifications page, immediately clear unread count & badge
  useEffect(() => {
    if (pathname === "/notifications" && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      fetch("/api/notifications", { method: "PUT" }).catch(() => {});
    }
  }, [pathname, unreadCount]);

  const handleSignOut = async () => {
    try {
      await useUserStore.getState().signOut();
    } catch {}
    setNotifications([]);
    setUnreadCount(0);
    window.location.href = "/login?force=true";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDeleteNotificationFromNavbar = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
      useToastStore.getState().addToast("Notification removed", "info");
    } catch {
      useToastStore.getState().addToast("Failed to remove notification", "error");
    }
  };

  const handleClearAllFromNavbar = () => {
    useToastStore.getState().openConfirm({
      title: "Clear all notifications",
      message: "Are you sure you want to delete all notifications? This action cannot be undone.",
      confirmLabel: "Clear All",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch("/api/notifications?all=true", { method: "DELETE" });
          setNotifications([]);
          setUnreadCount(0);
          window.dispatchEvent(new CustomEvent("notifications-updated"));
          useToastStore.getState().addToast("All notifications deleted", "info");
        } catch {
          useToastStore.getState().addToast("Failed to delete notifications", "error");
        }
      },
    });
  };

  // Find latest unread notification to determine badge type
  const latestUnread = notifications.find((n) => !n.is_read);

  return (
    <header className="sticky top-0 z-50 w-full h-14 sm:h-16 flex-shrink-0 border-b border-border bg-white dark:bg-[#090d16] shadow-xs select-none overscroll-none">
      <div className="flex h-14 sm:h-16 items-center justify-between px-2 sm:px-6">
        {/* Left: Mobile & Tablet hamburger + Brand */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none cursor-pointer active:scale-95 transition-all shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 group select-none shrink-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Terminal className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Code<span className="text-indigo-600 dark:text-indigo-400">Sphere</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden sm:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search C programs, algorithms, developers, posts..."
              className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-slate-100 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800/80 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-indigo-600 dark:caret-indigo-400 shadow-xs"
            />
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile search toggle */}
          <button
            onClick={() => {
              setShowMobileSearch(!showMobileSearch);
              setShowUserMenu(false);
              setShowThemeMenu(false);
              setShowNotifMenu(false);
            }}
            className="sm:hidden p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme switcher */}
          <div className="relative shrink-0" ref={themeMenuRef}>
            <button
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                setShowUserMenu(false);
                setShowNotifMenu(false);
              }}
              className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-popover shadow-xl py-1 text-sm z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setTheme("light");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-secondary cursor-pointer ${
                    theme === "light" ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-secondary cursor-pointer ${
                    theme === "dark" ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-secondary cursor-pointer ${
                    theme === "system" ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                  <span>System</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell with Dynamic Type Badge */}
          {user && (
            <div className="relative mr-1 shrink-0" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !showNotifMenu;
                  setShowNotifMenu(nextOpen);
                  setShowUserMenu(false);
                  setShowThemeMenu(false);

                  // Once the user opens notifications, clear unread badge immediately
                  if (nextOpen && unreadCount > 0) {
                    setUnreadCount(0);
                    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                    fetch("/api/notifications", { method: "PUT" }).catch(() => {});
                  }
                }}
                className="relative p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />

                {/* Impressive Dynamic Notification Indicator (Only visible if unreadCount > 0) */}
                {unreadCount > 0 && latestUnread && (
                  <>
                    {/* Glowing Ping Aura */}
                    <span
                      className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full animate-ping opacity-75 ${
                        latestUnread.notification_type === "like"
                          ? "bg-rose-500"
                          : latestUnread.notification_type === "comment"
                          ? "bg-violet-500"
                          : "bg-blue-500"
                      }`}
                    />

                    {/* Micro-badge with Specific Action Icon (Heart, Message, or UserPlus) */}
                    <span
                      className={`absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white ring-2 ring-card shadow-xs text-[8px] font-bold pointer-events-none ${
                        latestUnread.notification_type === "like"
                          ? "bg-gradient-to-tr from-rose-500 to-pink-500"
                          : latestUnread.notification_type === "comment"
                          ? "bg-gradient-to-tr from-violet-600 to-indigo-600"
                          : "bg-gradient-to-tr from-blue-600 to-cyan-500"
                      }`}
                    >
                      {latestUnread.notification_type === "like" ? (
                        <Heart className="w-2 h-2 fill-white" />
                      ) : latestUnread.notification_type === "comment" ? (
                        <MessageSquare className="w-2 h-2 fill-white" />
                      ) : latestUnread.notification_type === "follow" ? (
                        <UserPlus className="w-2 h-2" />
                      ) : (
                        <span className="text-[7px] font-bold">{unreadCount}</span>
                      )}
                    </span>
                  </>
                )}
              </button>

              {/* Notification Quick Preview Dropdown */}
              {showNotifMenu && (
                <>
                  {/* Backdrop overlay to catch outside clicks and eliminate visual bleed-through */}
                  <div
                    className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
                    onClick={() => setShowNotifMenu(false)}
                  />

                  <div
                    ref={notifDropdownRef}
                    className="fixed top-14 sm:top-16 right-2 sm:right-6 w-80 sm:w-96 max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl py-3 text-sm z-[90] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-xs">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAllFromNavbar}
                            className="text-xs text-rose-500 hover:text-rose-600 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                            title="Clear all notifications"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear all</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground bg-white dark:bg-slate-900">
                          <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                          No notifications
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`flex items-start gap-3 p-3.5 transition-colors group relative ${
                              !n.is_read
                                ? "bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <Link
                              href={n.notification_type === "follow" ? `/profile/${n.actor?.username}` : "/notifications"}
                              onClick={() => setShowNotifMenu(false)}
                              className="relative shrink-0 mt-0.5"
                            >
                              <UserAvatar
                                src={n.actor?.avatar_url}
                                alt={n.actor?.full_name || n.actor?.username}
                                size="sm"
                              />
                              <div
                                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white ring-1 ring-card ${
                                  n.notification_type === "like"
                                    ? "bg-rose-500"
                                    : n.notification_type === "comment"
                                    ? "bg-violet-600"
                                    : "bg-blue-600"
                                }`}
                              >
                                {n.notification_type === "like" ? (
                                  <Heart className="w-2 h-2 fill-white" />
                                ) : n.notification_type === "comment" ? (
                                  <MessageSquare className="w-2 h-2 fill-white" />
                                ) : (
                                  <UserPlus className="w-2 h-2" />
                                )}
                              </div>
                            </Link>

                            <Link
                              href={n.notification_type === "follow" ? `/profile/${n.actor?.username}` : "/notifications"}
                              onClick={() => setShowNotifMenu(false)}
                              className="flex-1 min-w-0"
                            >
                              <p className="text-xs text-slate-900 dark:text-slate-100 leading-snug">
                                <span className="font-semibold">{n.actor?.full_name || n.actor?.username}</span>{" "}
                                {isVerifiedAccount(n.actor) && <VerifiedBadge size="sm" className="inline-flex mr-1 align-middle" isTeam={isTeamAccount(n.actor?.username)} />}
                                {n.notification_type === "like" && "liked your C post"}
                                {n.notification_type === "comment" && "commented on your solution"}
                                {n.notification_type === "follow" && "started following you"}
                              </p>
                              {n.comment_text && (
                                <p className="text-[11px] text-muted-foreground italic truncate mt-0.5">
                                  &quot;{n.comment_text}&quot;
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {formatRelativeTime(n.created_at)}
                              </p>
                            </Link>

                            {/* Delete single notification button */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotificationFromNavbar(n.id, e)}
                              className="p-1 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer shrink-0"
                              title="Delete notification"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 px-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-1">
                      <Link
                        href="/notifications"
                        onClick={() => setShowNotifMenu(false)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                      >
                        <span>View all notifications</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* User profile dropdown or Sign-in button */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowThemeMenu(false);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1 sm:pl-1.5 pr-1.5 sm:pr-2 rounded-full border border-border hover:bg-secondary transition-colors cursor-pointer shrink-0"
              >
                <UserAvatar
                  src={profile?.avatar_url}
                  alt={profile?.full_name || profile?.username || user.email?.split("@")[0] || "Profile"}
                  size="xs"
                />
                <span className="text-xs font-semibold max-w-[90px] truncate hidden md:inline">
                  {profile?.username || user.email?.split("@")[0]}
                </span>
                {isVerifiedAccount(profile) && <VerifiedBadge size="sm" isTeam={isTeamAccount(profile?.username)} />}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-popover shadow-xl py-1 text-sm z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">
                        {profile?.full_name || "CodeSphere Developer"}
                      </p>
                      {isVerifiedAccount(profile) && <VerifiedBadge size="sm" isTeam={isTeamAccount(profile?.username)} />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{profile?.username || user.email?.split("@")[0]}
                    </p>
                  </div>
                  <Link
                    href={`/profile/${profile?.username || "me"}`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-foreground hover:bg-secondary"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/workspace"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-foreground hover:bg-secondary"
                  >
                    <Code2 className="w-4 h-4 text-muted-foreground" />
                    <span>My Workspace</span>
                  </Link>
                  <Link
                    href="/bookmarks"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-foreground hover:bg-secondary"
                  >
                    <Bookmark className="w-4 h-4 text-muted-foreground" />
                    <span>Bookmarks</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-foreground hover:bg-secondary"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Settings</span>
                  </Link>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-destructive hover:bg-destructive/10 text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/login?redirectTo=${encodeURIComponent(pathname || "/workspace")}&force=true`}
              className="inline-flex items-center justify-center px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Row */}
      {showMobileSearch && (
        <div className="sm:hidden px-4 py-2.5 border-t border-border bg-white dark:bg-[#090d16] animate-in slide-in-from-top-2 duration-150">
          <form
            onSubmit={(e) => {
              handleSearchSubmit(e);
              setShowMobileSearch(false);
            }}
            className="relative w-full"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search C programs, algorithms, developers..."
              autoFocus
              className="w-full h-9 pl-9 pr-8 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
}

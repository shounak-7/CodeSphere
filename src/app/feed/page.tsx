"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard, Post } from "@/components/feed/PostCard";
import { useUserStore } from "@/lib/store/useUserStore";
import { TrendingUp, HelpCircle, RefreshCw, Flame, Code2, Tag, X } from "lucide-react";
import { ScrollableNav } from "@/components/ui/ScrollableNav";

let cachedFeedPosts: Record<string, Post[]> = {};
let cachedTrendingTags: { tag: string; count: number }[] = [];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<"latest" | "questions">("latest");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>(() => cachedFeedPosts["latest:"] || cachedFeedPosts["latest"] || []);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>(() => cachedTrendingTags);
  const [loading, setLoading] = useState(() => !cachedFeedPosts["latest:"]?.length && !cachedFeedPosts["latest"]?.length);
  const user = useUserStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const currentUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      username:
        profile?.username ||
        (user.user_metadata?.user_name as string) ||
        (user.user_metadata?.username as string) ||
        user.email?.split("@")[0] ||
        "developer",
    };
  }, [user, profile]);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags/trending");
      const data = await res.json();
      if (Array.isArray(data.tags)) {
        setTrendingTags(data.tags);
        cachedTrendingTags = data.tags;
      }
    } catch {}
  }, []);

  const fetchPosts = useCallback(async (tabToFetch = activeTab, tagToFetch = selectedTag, forceRefresh = false) => {
    const cacheKey = `${tabToFetch}:${tagToFetch || ""}`;
    if (!cachedFeedPosts[cacheKey]?.length || forceRefresh) {
      setLoading(true);
    }
    try {
      const tagQuery = tagToFetch ? `&tag=${encodeURIComponent(tagToFetch)}` : "";
      const timeQuery = forceRefresh ? `&_t=${Date.now()}` : "";
      const res = await fetch(`/api/posts?tab=${tabToFetch}${tagQuery}${timeQuery}`, {
        cache: forceRefresh ? "no-store" : "default",
      });
      const data = await res.json();
      if (data.posts) {
        cachedFeedPosts[cacheKey] = data.posts;
        if (tabToFetch === activeTab && tagToFetch === selectedTag) {
          setPosts(data.posts);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedTag]);

  const handleTabChange = (tab: "latest" | "questions") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const key = `${tab}:${selectedTag || ""}`;
    if (cachedFeedPosts[key]) {
      // 0ms instant display from cache
      setPosts(cachedFeedPosts[key]);
      setLoading(false);
    }
  };

  // Fetch trending tags and pre-warm alternate tab on mount
  useEffect(() => {
    fetchTrendingTags();

    // Pre-warm the alternate feed in background for instantaneous switching
    fetch("/api/posts?tab=questions")
      .then((res) => res.json())
      .then((data) => {
        if (data?.posts) {
          cachedFeedPosts["questions:"] = data.posts;
        }
      })
      .catch(() => {});
  }, [fetchTrendingTags]);

  // Fetch posts when tab or tag filter changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = () => {
    cachedFeedPosts = {};
    fetchPosts();
    fetchTrendingTags();
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
    // Clean deleted post out of all cached tabs
    for (const key of Object.keys(cachedFeedPosts)) {
      if (Array.isArray(cachedFeedPosts[key])) {
        cachedFeedPosts[key] = cachedFeedPosts[key].filter((p) => p.id !== deletedId);
      }
    }
    // Immediately refresh trending hashtags
    fetchTrendingTags();
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Feed Column (8 cols on lg) */}
          <div className="lg:col-span-8">
            {/* Post Composer */}
            <PostComposer onPostCreated={handlePostCreated} currentUser={currentUser} />

            {/* Active Tag Filter Pill */}
            {selectedTag && (
              <div className="flex items-center justify-between p-2 sm:p-3 mb-2.5 sm:mb-4 rounded-xl bg-primary/10 border border-primary/20 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2 text-primary font-semibold">
                  <Tag className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span>Filtered by #{selectedTag}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-card hover:bg-secondary text-foreground text-[11px] sm:text-xs font-medium cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Filter</span>
                </button>
              </div>
            )}

            {/* Feed Tabs & Refresh */}
            <div className="flex items-center justify-between mb-2.5 sm:mb-4 pb-1.5 sm:pb-2 border-b border-border">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleTabChange("latest")}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "latest"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  Latest Feed
                </button>
                <button
                  onClick={() => handleTabChange("questions")}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                    activeTab === "questions"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <HelpCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span>DSA Questions</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchPosts(activeTab, selectedTag, true);
                  fetchTrendingTags();
                }}
                disabled={loading}
                className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Refresh Feed"
              >
                <RefreshCw className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Mobile / Tablet Horizontal Trending Topics Bar */}
            {trendingTags.length > 0 && (
              <div className="lg:hidden pb-1.5 sm:pb-2 mb-2.5 sm:mb-4">
                <ScrollableNav className="gap-1.5">
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase shrink-0 mr-1">
                    <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-orange-500" />
                    <span>Trending:</span>
                  </div>
                  {trendingTags.map((item) => (
                    <button
                      key={item.tag}
                      onClick={() => setSelectedTag(item.tag === selectedTag ? null : item.tag)}
                      className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs shrink-0 transition-all font-medium cursor-pointer ${
                        selectedTag === item.tag
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      #{item.tag}
                    </button>
                  ))}
                </ScrollableNav>
              </div>
            )}

            {/* Posts List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-2xl border border-border bg-card p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-secondary" />
                      <div className="space-y-2">
                        <div className="w-32 h-3.5 bg-secondary rounded" />
                        <div className="w-20 h-2.5 bg-secondary rounded" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="w-full h-3 bg-secondary rounded" />
                      <div className="w-4/5 h-3 bg-secondary rounded" />
                    </div>
                    <div className="w-full h-24 bg-secondary rounded-xl" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
                <Code2 className="w-10 h-10 mx-auto mb-3 opacity-40 text-primary" />
                <h3 className="text-base font-bold text-foreground">No posts yet in this feed</h3>
                <p className="text-xs max-w-sm mx-auto mt-1">
                  Be the first to share your C programs, algorithmic breakthroughs, or ask a question!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  currentUsername={currentUser?.username}
                  currentUserAvatar={profile?.avatar_url || (user?.user_metadata?.avatar_url as string)}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            )}
          </div>

          {/* Right Sidebar Column (4 cols on lg): Dynamic Real Trending Topics */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            {/* Real Trending Topics Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Trending C Topics</span>
              </div>
              <div className="space-y-1.5">
                {trendingTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Add tags when publishing your C code to see trending topics appear here.
                  </p>
                ) : (
                  trendingTags.map((item) => (
                    <button
                      type="button"
                      key={item.tag}
                      onClick={() => setSelectedTag(item.tag === selectedTag ? null : item.tag)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                        selectedTag === item.tag
                          ? "bg-primary/15 text-primary border border-primary/30 font-bold"
                          : "hover:bg-secondary text-foreground"
                      }`}
                    >
                      <span className="text-xs font-semibold text-primary">#{item.tag}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground font-mono">
                        {item.count} {item.count === 1 ? "post" : "posts"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

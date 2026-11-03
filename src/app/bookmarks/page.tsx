"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Bookmark,
  Code2,
  FolderArchive,
  MessageSquare,
  Trash2,
  ExternalLink,
  HelpCircle,
  Trophy,
  Sparkles,
  Heart,
  MessageCircle,
  Tag,
  Loader2,
  Terminal,
  FolderPlus,
  Share2,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { VerifiedBadge, isTeamAccount, isVerifiedAccount } from "@/components/ui/VerifiedBadge";
import { VSCodeSnippet } from "@/components/feed/VSCodeSnippet";
import { useToastStore } from "@/lib/store/useToastStore";
import { ScrollableNav } from "@/components/ui/ScrollableNav";

interface EnrichedPost {
  id: string;
  author_id: string;
  title?: string;
  content: string;
  post_type: "text" | "code" | "achievement" | "question" | "update";
  code_snippet?: string;
  language?: string;
  tags?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: {
    id?: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface EnrichedProgram {
  id: string;
  title: string;
  description?: string;
  source_code?: string;
  category?: string;
  updated_at?: string;
}

interface EnrichedCollection {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
}

interface BookmarkItem {
  id: string;
  target_type: "post" | "program" | "collection";
  target_id: string;
  created_at: string;
  post?: EnrichedPost | null;
  program?: EnrichedProgram | null;
  collection?: EnrichedCollection | null;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "post" | "program" | "collection">("all");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [importingPostId, setImportingPostId] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks");
      const data = await res.json();
      if (Array.isArray(data.bookmarks)) {
        setBookmarks(data.bookmarks);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemove = async (targetType: string, targetId: string) => {
    setRemovingId(targetId);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.target_id !== targetId));
        useToastStore.getState().addToast("Bookmark removed", "info");
      }
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToWorkspace = async (post: EnrichedPost) => {
    if (!post.code_snippet) return;
    setImportingPostId(post.id);
    try {
      let rawTitle = post.title?.trim() || "saved_code";
      const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
      const title = cleanTitle.endsWith(".c") ? cleanTitle : `${cleanTitle}.c`;

      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          source_code: post.code_snippet,
          category: "Saved",
          description: `Cloned from bookmarked post: "${post.title || post.content.slice(0, 40)}"`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.program) {
        useToastStore.getState().addToast(`Saved "${title}" to your Workspace!`, "success");
      } else {
        useToastStore.getState().addToast(data.error || "Failed to add to workspace", "error");
      }
    } finally {
      setImportingPostId(null);
    }
  };

  const counts = useMemo(() => {
    const postCount = bookmarks.filter((b) => b.target_type === "post").length;
    const progCount = bookmarks.filter((b) => b.target_type === "program").length;
    const colCount = bookmarks.filter((b) => b.target_type === "collection").length;
    return { all: bookmarks.length, post: postCount, program: progCount, collection: colCount };
  }, [bookmarks]);

  const filtered = useMemo(() => {
    return bookmarks.filter((b) => filterType === "all" || b.target_type === filterType);
  }, [bookmarks, filterType]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 lg:py-8 w-full overflow-x-hidden">
        {/* Header with macOS Glass Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8 pb-3.5 sm:pb-5 border-b border-border">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
              <Bookmark className="w-4 sm:w-5 h-4 sm:h-5 fill-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-foreground">
                Saved Bookmarks
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Quick access to your saved community posts, C programs, and collections
              </p>
            </div>
          </div>

          {/* Filter Pills with Scrollable Navigation */}
          <div className="p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-secondary/60 border border-border/80 backdrop-blur-md max-w-full">
            <ScrollableNav className="gap-1 sm:gap-1.5">
              {[
                { id: "all", label: "All", count: counts.all },
                { id: "post", label: "Posts", count: counts.post },
                { id: "program", label: "Programs", count: counts.program },
                { id: "collection", label: "Collections", count: counts.collection },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    filterType === f.id
                      ? "bg-card text-foreground shadow-xs font-bold border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono ${
                      filterType === f.id
                        ? "bg-primary/10 text-primary"
                        : "bg-background/80 text-muted-foreground"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </ScrollableNav>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-24 sm:h-32 rounded-xl sm:rounded-2xl bg-card/60 border border-border animate-pulse p-4 sm:p-6"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 sm:p-12 text-center text-muted-foreground shadow-sm">
            <div className="w-10 sm:w-14 h-10 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-inner">
              <Bookmark className="w-5 sm:w-7 h-5 sm:h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {filterType === "all" ? "No bookmarks saved yet" : `No ${filterType} bookmarks found`}
            </h3>
            <p className="text-[11px] sm:text-xs max-w-sm mx-auto mt-1 sm:mt-1.5 leading-relaxed">
              When exploring the community feed or public workspaces, click the bookmark icon on any post or code snippet to save it here for reference.
            </p>
            <div className="mt-4 sm:mt-5">
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                <span>Explore Community Feed</span>
                <ExternalLink className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((b) => {
              const isRemoving = removingId === b.target_id;

              // 1. RICH POST CARD BOOKMARK
              if (b.target_type === "post") {
                const post = b.post;
                const authorUsername = post?.author?.username || "developer";
                const isVerified = isVerifiedAccount(post?.author);

                return (
                  <div
                    key={b.id}
                    className="rounded-xl sm:rounded-2xl border border-border bg-card/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-200 group"
                  >
                    {/* Post Top Row: Author details + Bookmark info + Remove action */}
                    <div className="flex items-start justify-between gap-3 mb-2.5 sm:mb-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Link href={`/profile/${authorUsername}`} className="group/author flex items-center gap-2 sm:gap-3">
                          <UserAvatar
                            src={post?.author?.avatar_url}
                            alt={post?.author?.full_name || authorUsername}
                            size="sm"
                            className="sm:w-10 sm:h-10 ring-2 ring-background group-hover/author:ring-primary transition-all"
                          />
                          <div>
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <span className="text-[11px] sm:text-xs font-bold text-foreground group-hover/author:text-primary transition-colors">
                                {post?.author?.full_name || "CodeSphere Developer"}
                              </span>
                              {isVerified && <VerifiedBadge size="sm" isTeam={isTeamAccount(authorUsername)} />}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground font-mono">
                              <span>@{authorUsername}</span>
                              {post?.created_at && (
                                <>
                                  <span>•</span>
                                  <span>{formatRelativeTime(post.created_at)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Link
                          href={`/feed#post-${b.target_id}`}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground border border-border/80 transition-colors shadow-2xs"
                        >
                          <span>View in Feed</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </Link>

                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => handleRemove(b.target_type, b.target_id)}
                          className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove bookmark"
                        >
                          {isRemoving ? <Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin" /> : <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Post Title */}
                    {post?.title && (
                      <h3 className="text-xs sm:text-sm font-bold text-foreground mb-1 sm:mb-1.5">
                        {post.title}
                      </h3>
                    )}

                    {/* Post Content */}
                    {post?.content && (
                      <p className="text-[11px] sm:text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed mb-2.5 sm:mb-3">
                        {post.content}
                      </p>
                    )}

                    {/* VS Code Code Snippet Preview */}
                    {post?.code_snippet && (
                      <div className="mb-3">
                        <VSCodeSnippet
                          code={post.code_snippet}
                          filename={post.title ? `${post.title.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 16)}.c` : "snippet.c"}
                          postAuthor={authorUsername}
                          onAddToWorkspace={() => handleAddToWorkspace(post)}
                          importingCode={importingPostId === post.id}
                        />
                      </div>
                    )}

                    {/* Tags & Footer Meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post?.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium bg-secondary text-foreground/80 border border-border/60"
                          >
                            <Tag className="w-2.5 h-2.5 text-primary" />
                            <span>#{tag}</span>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                          <span>{post?.likes_count || 0}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{post?.comments_count || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. RICH PROGRAM BOOKMARK
              if (b.target_type === "program") {
                const prog = b.program;

                return (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-border bg-card/90 dark:bg-slate-900/80 backdrop-blur-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-xs">
                          <Code2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            {prog?.title || "C Program"}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-bold">C</span>
                            <span>•</span>
                            <span>{prog?.category || "Workspace"}</span>
                            {b.created_at && (
                              <>
                                <span>•</span>
                                <span>Saved {formatDate(b.created_at)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Link
                          href={`/workspace?programId=${b.target_id}`}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all cursor-pointer"
                        >
                          <span>Open in Workspace</span>
                          <ExternalLink className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                        </Link>

                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => handleRemove(b.target_type, b.target_id)}
                          className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove bookmark"
                        >
                          {isRemoving ? <Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin" /> : <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
                        </button>
                      </div>
                    </div>

                    {prog?.description && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 leading-relaxed">
                        {prog.description}
                      </p>
                    )}
                  </div>
                );
              }

              // 3. COLLECTION BOOKMARK
              return (
                <div
                  key={b.id}
                  className="rounded-xl sm:rounded-2xl border border-border bg-card/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <FolderArchive className="w-4 sm:w-5 h-4 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">
                        {b.collection?.title || "Public Collection"}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                        Saved on {formatDate(b.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      href={`/collections/${b.target_id}`}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors shadow-2xs"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </Link>

                    <button
                      type="button"
                      disabled={isRemoving}
                      onClick={() => handleRemove(b.target_type, b.target_id)}
                      className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove bookmark"
                    >
                      {isRemoving ? <Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin" /> : <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
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

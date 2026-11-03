"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Trash2,
  Send,
  HelpCircle,
  Trophy,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useToastStore } from "@/lib/store/useToastStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { VSCodeSnippet } from "@/components/feed/VSCodeSnippet";
import { VerifiedBadge, isTeamAccount, isVerifiedAccount } from "@/components/ui/VerifiedBadge";

export interface Post {
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
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_following?: boolean;
  is_author?: boolean;
  created_at: string;
  author?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  currentUsername?: string;
  onPostDeleted?: (id: string) => void;
}

export function PostCard({ post, currentUserId, currentUsername, onPostDeleted }: PostCardProps) {
  const [liked, setLiked] = useState(Boolean(post.is_liked));
  const [likesCount, setLikesCount] = useState(typeof post.likes_count === "number" ? post.likes_count : 0);
  const [bookmarked, setBookmarked] = useState(Boolean(post.is_bookmarked));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [commentInput, setCommentInput] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [following, setFollowing] = useState(Boolean(post.is_following));
  const [importingCode, setImportingCode] = useState(false);

  // Synchronize state when post prop changes (e.g. on feed refresh/tab switch)
  useEffect(() => {
    setLiked(Boolean(post.is_liked));
    setLikesCount(typeof post.likes_count === "number" ? post.likes_count : 0);
    setBookmarked(Boolean(post.is_bookmarked));
    setCommentsCount(post.comments_count || 0);
    setFollowing(Boolean(post.is_following));
  }, [post.is_liked, post.likes_count, post.is_bookmarked, post.comments_count, post.is_following]);

  // Delete is strictly restricted only to the same author who posted it
  const isAuthor = Boolean(
    post.is_author ||
    (currentUserId && (currentUserId === post.author_id || currentUserId === post.author?.id)) ||
    (currentUsername && post.author?.username && (
      currentUsername.toLowerCase() === post.author.username.toLowerCase() ||
      (currentUsername.toLowerCase() === "team" && post.author.username.toLowerCase() === "codesphere") ||
      (currentUsername.toLowerCase() === "codesphere" && post.author.username.toLowerCase() === "team")
    ))
  );

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      useToastStore.getState().addToast("Please sign in to follow developers.", "warning");
      return;
    }
    if (!post.author?.username) return;
    const nextVal = !following;
    setFollowing(nextVal);
    try {
      const res = await fetch(`/api/profiles/${post.author.username}/follow`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
        useToastStore.getState().addToast(
          data.following ? `Now following @${post.author.username}` : `Unfollowed @${post.author.username}`,
          "info"
        );
      } else {
        setFollowing(!nextVal);
        useToastStore.getState().addToast(data.error || "Failed to update follow", "error");
      }
    } catch {
      setFollowing(!nextVal);
    }
  };

  const handleAddToWorkspace = async () => {
    if (!currentUserId) {
      useToastStore.getState().addToast("Please sign in to save programs to your workspace.", "warning");
      return;
    }
    if (!post.code_snippet) return;
    setImportingCode(true);
    try {
      let rawTitle = post.title?.trim() || "community_code";
      const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
      const title = cleanTitle.endsWith(".c") ? cleanTitle : `${cleanTitle}.c`;

      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          source_code: post.code_snippet,
          category: "Community",
          description: `Imported from @${post.author?.username || "community"} post: "${post.title || post.content.slice(0, 40)}"`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.program) {
        useToastStore.getState().addToast(
          `Added "${title}" to your Personal Workspace!`,
          "success"
        );
      } else {
        useToastStore.getState().addToast(data.error || "Failed to add to workspace", "error");
      }
    } finally {
      setImportingCode(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUserId) {
      useToastStore.getState().addToast("Please sign in to like posts.", "warning");
      return;
    }
    const nextLiked = !liked;
    const optimisticCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLiked(nextLiked);
    setLikesCount(optimisticCount);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setLiked(!nextLiked);
        setLikesCount(likesCount);
        useToastStore.getState().addToast(data.error || "Failed to update like", "error");
      } else {
        setLiked(data.liked);
        if (typeof data.count === "number") {
          setLikesCount(data.count);
        }
      }
    } catch {
      setLiked(!nextLiked);
      setLikesCount(likesCount);
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentUserId) {
      useToastStore.getState().addToast("Please sign in to bookmark posts.", "warning");
      return;
    }
    const nextVal = !bookmarked;
    setBookmarked(nextVal);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: "post", target_id: post.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarked(data.bookmarked);
        useToastStore.getState().addToast(
          data.bookmarked ? "Post saved to Bookmarks!" : "Post removed from Bookmarks",
          "info"
        );
      } else {
        setBookmarked(!nextVal);
        useToastStore.getState().addToast(data.error || "Failed to bookmark", "error");
      }
    } catch {
      setBookmarked(!nextVal);
    }
  };

  const handleLoadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
        setCommentsCount(data.comments.length);
      }
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      useToastStore.getState().addToast("Please sign in to comment on posts.", "warning");
      return;
    }
    if (!commentInput.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setCommentsCount((prev) => prev + 1);
        setCommentInput("");
        useToastStore.getState().addToast("Comment posted!", "success");
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentsCount((prev) => Math.max(0, prev - 1));
        useToastStore.getState().addToast("Comment deleted", "info");
      } else {
        useToastStore.getState().addToast("Failed to delete comment", "error");
      }
    } catch {
      useToastStore.getState().addToast("Failed to delete comment", "error");
    }
  };

  const handleDeletePost = () => {
    useToastStore.getState().openConfirm({
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmLabel: "Delete Post",
      isDestructive: true,
      onConfirm: async () => {
        const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
        if (res.ok) {
          useToastStore.getState().addToast("Post deleted successfully", "info");
          onPostDeleted?.(post.id);
        } else {
          useToastStore.getState().addToast("Failed to delete post", "error");
        }
      },
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    navigator.clipboard.writeText(url);
    useToastStore.getState().addToast("Post link copied to clipboard!", "success");
  };

  // Determine code snippet filename
  const snippetFilename = post.title
    ? `${post.title.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 18)}.c`
    : "snippet.c";

  return (
    <article
      id={`post-${post.id}`}
      className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-5 lg:p-6 shadow-sm mb-3 sm:mb-5 transition-all hover:border-border/80"
    >
      {/* Post Author Header */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-4 gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link href={`/profile/${post.author?.username || "user"}`} className="group flex items-center gap-2.5 sm:gap-3 min-w-0">
            <UserAvatar
              src={post.author?.avatar_url}
              alt={post.author?.full_name || "Author"}
              size="md"
              className="group-hover:ring-2 group-hover:ring-primary transition-all shrink-0 w-8 h-8 sm:w-10 sm:h-10 text-xs"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-none">
                  {post.author?.full_name || "CodeSphere Developer"}
                </p>
                {isVerifiedAccount(post.author) && (
                  <VerifiedBadge size="sm" isTeam={isTeamAccount(post.author?.username)} />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground truncate">
                <span className="truncate">@{post.author?.username || "coder"}</span>
                <span>•</span>
                <span className="shrink-0">{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!isAuthor && post.author?.username && post.author_id !== "user-system" && (
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                following
                  ? "bg-secondary text-foreground border border-border hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}

          {post.post_type === "question" && (
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <HelpCircle className="w-3 h-3" /> Question
            </span>
          )}
          {post.post_type === "achievement" && (
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Trophy className="w-3 h-3" /> Achievement
            </span>
          )}

          {isAuthor && (
            <button
              onClick={handleDeletePost}
              className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Delete Post"
            >
              <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Post Title & Content */}
      {post.title && (
        <h3 className="text-sm sm:text-base font-bold text-foreground mb-1.5 sm:mb-2 leading-snug">
          {post.title}
        </h3>
      )}

      <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-2.5 sm:mb-4">
        {post.content}
      </p>

      {/* VS Code Style C Code Snippet */}
      {post.code_snippet && (
        <VSCodeSnippet
          code={post.code_snippet}
          filename={snippetFilename}
          onAddToWorkspace={handleAddToWorkspace}
          importingCode={importingCode}
        />
      )}

      {/* Tags with # prefix */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2.5 sm:mb-4">
          {post.tags.map((t) => {
            const displayTag = t.startsWith("#") ? t : `#${t}`;
            return (
              <span
                key={t}
                className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 cursor-pointer transition-colors"
              >
                {displayTag}
              </span>
            );
          })}
        </div>
      )}

      {/* Action Footer: Like, Comment, Bookmark, Share */}
      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border text-[11px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              liked
                ? "bg-rose-500/10 text-rose-500 font-bold"
                : "hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Heart className={`w-3.5 sm:w-4 h-3.5 sm:h-4 transition-transform duration-200 ${liked ? "fill-rose-500 text-rose-500 scale-110" : "group-hover:scale-110"}`} />
            <span>{likesCount}</span>
          </button>

          <button
            type="button"
            onClick={handleLoadComments}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl hover:bg-secondary hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span>{commentsCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              bookmarked ? "bg-primary/10 text-primary font-semibold" : "hover:bg-secondary hover:text-foreground"
            }`}
            title={bookmarked ? "Remove Bookmark" : "Save Bookmark"}
          >
            <Bookmark className={`w-4 h-4 transition-transform ${bookmarked ? "fill-primary scale-105" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl hover:bg-secondary hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {/* Comment composer */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a constructive comment..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary caret-indigo-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentInput.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submittingComment ? "..." : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Comments list */}
          {loadingComments ? (
            <p className="text-xs text-muted-foreground py-2 text-center">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <UserAvatar
                    src={c.author?.avatar_url}
                    alt={c.author?.full_name || "Commenter"}
                    size="xs"
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-foreground">@{c.author?.username || "coder"}</span>
                      {isVerifiedAccount(c.author) && (
                        <VerifiedBadge size="sm" isTeam={isTeamAccount(c.author?.username)} />
                      )}
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(c.created_at)}</span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>

                {Boolean(
                  (currentUserId && (currentUserId === c.author_id || currentUserId === (c.author as any)?.id)) ||
                  (currentUsername && c.author?.username && currentUsername.toLowerCase() === c.author.username.toLowerCase())
                ) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Delete Comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </article>
  );
}

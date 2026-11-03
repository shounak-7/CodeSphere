"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Code2, HelpCircle, Trophy, Sparkles, X, Plus, LogIn } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";

interface PostComposerProps {
  onPostCreated: () => void;
  currentUser?: { id: string; username?: string } | null;
}

export function PostComposer({ onPostCreated, currentUser }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState<"text" | "code" | "question" | "achievement" | "update">("text");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentUser) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-3.5 sm:p-5 mb-3 sm:mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">Join the CodeSphere Community</h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Sign in to share C programs, ask algorithmic questions, comment, and save code to your workspace.
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In / Register</span>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const tags = tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim().toLowerCase().replace(/^#+/, ""))
        .filter(Boolean);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          post_type: showCodeInput ? "code" : postType,
          code_snippet: showCodeInput ? codeSnippet : null,
          language: "c",
          tags,
        }),
      });

      if (res.ok) {
        setContent("");
        setTitle("");
        setCodeSnippet("");
        setTagsInput("");
        setShowCodeInput(false);
        setIsExpanded(false);
        useToastStore.getState().addToast("Post shared to community feed!", "success");
        onPostCreated();
      } else {
        const data = await res.json();
        useToastStore.getState().addToast(data.error || "Failed to publish post", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 mb-3 sm:mb-6">
      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
        {isExpanded && (
          <div className="flex items-center gap-1.5 sm:gap-2 pb-1.5 sm:pb-2 border-b border-border overflow-x-auto scrollbar-none">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase">Type:</span>
            {[
              { id: "text", label: "Discussion", icon: null },
              { id: "question", label: "DSA Question", icon: HelpCircle },
              { id: "achievement", label: "Achievement", icon: Trophy },
              { id: "update", label: "Learning Update", icon: Sparkles },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setPostType(t.id as any)}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors flex items-center gap-1 shrink-0 ${
                  postType === t.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon && <t.icon className="w-3 h-3" />}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {isExpanded && (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post Title (optional)..."
            className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 caret-indigo-600 dark:caret-indigo-400 transition-all shadow-inner"
          />
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="Share a C programming concept, DSA solution, or ask a question..."
          rows={isExpanded ? 3 : 2}
          className="w-full p-2.5 sm:p-3.5 text-xs sm:text-sm rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 caret-indigo-600 dark:caret-indigo-400 transition-all shadow-inner resize-none"
        />

        {showCodeInput && (
          <div className="space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#090d16] p-2.5 sm:p-3 text-slate-200 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
              <span className="font-mono flex items-center gap-1.5 text-primary font-bold">
                <Code2 className="w-3.5 h-3.5" /> Attach C Snippet
              </span>
              <button
                type="button"
                onClick={() => setShowCodeInput(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder={`#include <stdio.h>\n\nint main() {\n    // Write or paste C code here\n    return 0;\n}`}
              rows={6}
              className="w-full font-mono text-xs bg-transparent text-slate-100 p-1 resize-none focus:outline-none placeholder:text-slate-600"
            />
          </div>
        )}

        {isExpanded && (
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags (e.g. #recursion, #factorial, #dsa, #c11)..."
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 caret-indigo-600 dark:caret-indigo-400 transition-all shadow-inner"
          />
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {!showCodeInput && (
              <button
                type="button"
                onClick={() => {
                  setShowCodeInput(true);
                  setIsExpanded(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-primary" />
                <span>Add C Code</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Collapse
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Publish</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

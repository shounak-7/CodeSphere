"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useUserStore } from "@/lib/store/useUserStore";
import {
  FolderArchive,
  FolderPlus,
  Search,
  Code2,
  FolderOpen,
  Check,
  ChevronRight,
  X,
  Loader2,
  FileCode,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToastStore } from "@/lib/store/useToastStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { VerifiedBadge, isTeamAccount, isVerifiedAccount } from "@/components/ui/VerifiedBadge";
import { createClient } from "@/lib/supabase/client";

interface WorkspaceProgram {
  id: string;
  title: string;
  description?: string;
  category?: string;
  source_code?: string;
  updated_at?: string;
}

interface Collection {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  created_at: string;
  owner?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  collection_programs?: any[];
  programs?: any[];
}

const FOLDER_GRADIENTS = [
  "from-indigo-600 via-indigo-500 to-violet-600 shadow-indigo-500/20",
  "from-blue-600 via-sky-500 to-cyan-500 shadow-blue-500/20",
  "from-emerald-600 via-teal-500 to-teal-600 shadow-emerald-500/20",
  "from-amber-500 via-orange-500 to-red-500 shadow-amber-500/20",
  "from-purple-600 via-fuchsia-500 to-pink-500 shadow-purple-500/20",
  "from-rose-500 via-pink-500 to-rose-600 shadow-rose-500/20",
];

let cachedCollections: Collection[] | null = null;

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>(() => cachedCollections || []);
  const [loading, setLoading] = useState(() => !cachedCollections);
  const [search, setSearch] = useState("");
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
        "",
    };
  }, [user, profile]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [programSearch, setProgramSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User's Workspace Programs
  const [workspacePrograms, setWorkspacePrograms] = useState<WorkspaceProgram[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  const fetchCollections = async () => {
    if (!cachedCollections) {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/collections");
      const data = await res.json();
      if (Array.isArray(data.collections)) {
        setCollections(data.collections);
        cachedCollections = data.collections;
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspacePrograms = async () => {
    setLoadingWorkspace(true);
    try {
      const res = await fetch("/api/programs");
      const data = await res.json();
      if (Array.isArray(data.programs)) {
        setWorkspacePrograms(data.programs);
      }
    } finally {
      setLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleDeleteCollection = (col: Collection, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    useToastStore.getState().openConfirm({
      title: "Delete Collection",
      message: `Are you sure you want to delete "${col.title}"? This public folder will be permanently removed.`,
      confirmLabel: "Delete Collection",
      isDestructive: true,
      onConfirm: async () => {
        setDeletingId(col.id);
        try {
          const res = await fetch(`/api/collections/${col.id}`, { method: "DELETE" });
          if (res.ok) {
            setCollections((prev) => prev.filter((c) => c.id !== col.id));
            useToastStore.getState().addToast("Collection deleted successfully", "success");
          } else {
            useToastStore.getState().addToast("Failed to delete collection", "error");
          }
        } catch {
          useToastStore.getState().addToast("Network error deleting collection", "error");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleOpenPublishModal = () => {
    if (!currentUser?.id) {
      useToastStore.getState().addToast("Please sign in to publish your collections.", "warning");
      return;
    }
    setShowCreateModal(true);
    fetchWorkspacePrograms();
  };

  const handleToggleProgram = (id: string) => {
    setSelectedProgramIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedProgramIds(workspacePrograms.map((p) => p.id));
  };

  const handleClearSelection = () => {
    setSelectedProgramIds([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      useToastStore.getState().addToast("Please sign in to publish your collections.", "warning");
      return;
    }
    if (!newTitle.trim()) {
      useToastStore.getState().addToast("Please provide a collection name", "error");
      return;
    }

    if (selectedProgramIds.length === 0) {
      useToastStore.getState().addToast("Please select at least 1 program from your workspace", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          program_ids: selectedProgramIds,
          visibility: "public",
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        setSelectedProgramIds([]);
        setShowCreateModal(false);
        useToastStore
          .getState()
          .addToast(`Published collection "${newTitle.trim()}" to Public Collections!`, "success");
        fetchCollections();
      } else {
        const data = await res.json();
        useToastStore.getState().addToast(data.error || "Failed to publish collection", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return collections.filter((c) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const inTitle = c.title.toLowerCase().includes(q);
      const inDesc = c.description?.toLowerCase().includes(q);
      const inOwner =
        c.owner?.username.toLowerCase().includes(q) ||
        c.owner?.full_name.toLowerCase().includes(q);
      return inTitle || inDesc || inOwner;
    });
  }, [collections, search]);

  const filteredWorkspacePrograms = useMemo(() => {
    if (!programSearch.trim()) return workspacePrograms;
    const q = programSearch.toLowerCase().trim();
    return workspacePrograms.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [workspacePrograms, programSearch]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 lg:py-8 space-y-4 sm:space-y-8">
        {/* ========================================================= */}
        {/* 1. BIG CLEAN PAGE HEADER                                  */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Public Collections
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Curated folders of C programs shared by the community.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenPublishModal}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
          >
            <FolderPlus className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span>New Collection</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. MINIMAL SEARCH BAR                                     */}
        {/* ========================================================= */}
        <div className="relative max-w-lg">
          <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground/70 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="w-full h-8 sm:h-11 pl-8 sm:pl-10 pr-8 sm:pr-9 rounded-lg sm:rounded-xl bg-card dark:bg-slate-900/90 border border-border/80 dark:border-white/10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all duration-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-md"
            >
              <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. MINIMAL COLLECTIONS GRID                               */}
        {/* ========================================================= */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-32 sm:h-44 rounded-xl sm:rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-6 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl sm:rounded-2xl border border-border/70 bg-card p-6 sm:p-12 text-center text-muted-foreground space-y-2 sm:space-y-3">
            <FolderArchive className="w-8 sm:w-10 h-8 sm:h-10 mx-auto text-primary opacity-40" />
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {search ? "No collections found" : "No public collections yet"}
            </h3>
            <p className="text-xs sm:text-sm max-w-sm mx-auto">
              {search
                ? "Try searching with a different term."
                : "Select programs from your workspace and publish the first collection!"}
            </p>
            <button
              type="button"
              onClick={handleOpenPublishModal}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm cursor-pointer mt-2"
            >
              Create Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filtered.map((col, index) => {
              const gradient = FOLDER_GRADIENTS[index % FOLDER_GRADIENTS.length];
              const programCount = col.programs?.length || col.collection_programs?.length || 0;
              const authorUsername = col.owner?.username || "developer";
              const isVerified = isVerifiedAccount(col.owner);
              const isOwner = Boolean(
                currentUser &&
                  (currentUser.id === col.owner_id ||
                    currentUser.id === "default-user" ||
                    currentUser.id === "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1" ||
                    (currentUser.username &&
                      col.owner?.username &&
                      currentUser.username.toLowerCase() === col.owner.username.toLowerCase()) ||
                    currentUser.username?.toLowerCase() === "codesphere" ||
                    currentUser.username?.toLowerCase() === "team")
              );

              return (
                <div
                  key={col.id}
                  className="rounded-xl sm:rounded-2xl border border-border/70 dark:border-white/[0.08] bg-card hover:bg-card/95 hover:border-primary/40 dark:hover:border-primary/40 shadow-xs hover:shadow-xl transition-all duration-200 p-3.5 sm:p-6 flex flex-col justify-between group hover:-translate-y-0.5"
                >
                  <div>
                    {/* Top Row: Large Colorful Folder Badge + Program Count Pill & Delete Button */}
                    <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-2.5 sm:mb-4">
                      <Link
                        href={`/collections/${col.id}`}
                        className={`w-10 sm:w-14 h-10 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-105 shrink-0`}
                      >
                        <FolderArchive className="w-5 sm:w-7 h-5 sm:h-7" />
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          {programCount} {programCount === 1 ? "Program" : "Programs"}
                        </span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCollection(col, e)}
                            disabled={deletingId === col.id}
                            className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Collection"
                            aria-label="Delete Collection"
                          >
                            {deletingId === col.id ? (
                              <Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-rose-500/70 hover:text-rose-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <Link href={`/collections/${col.id}`} className="block">
                      {/* Title */}
                      <h3 className="text-base sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1 mt-1">
                        {col.title}
                      </h3>

                      {/* Minimal Description */}
                      {col.description && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
                          {col.description}
                        </p>
                      )}
                    </Link>
                  </div>

                  {/* Clean Footer */}
                  <div className="pt-2.5 sm:pt-4 mt-3 sm:mt-5 border-t border-border/40 flex items-center justify-between text-[11px] sm:text-xs">
                    <Link
                      href={`/profile/${authorUsername}`}
                      className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity"
                    >
                      <UserAvatar
                        src={col.owner?.avatar_url}
                        alt={authorUsername}
                        size="xs"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[11px] sm:text-xs font-semibold">@{authorUsername}</span>
                        {isVerified && <VerifiedBadge size="sm" isTeam={isTeamAccount(authorUsername)} />}
                      </div>
                    </Link>

                    <Link
                      href={`/collections/${col.id}`}
                      className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary group-hover:translate-x-1 transition-all"
                    >
                      <span>Open</span>
                      <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. CLEAN PUBLISH MODAL (WORKSPACE PROGRAM SELECTOR)        */}
        {/* ========================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-xl rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    New Public Collection
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a group of programs from your workspace to publish together.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreate} className="space-y-4 pt-4 flex-1 overflow-y-auto pr-1">
                {/* Collection Name */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Collection / Folder Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Binary Search Trees, Practical Exam Prep"
                    className="w-full h-11 px-4 text-sm font-medium rounded-xl bg-secondary/40 dark:bg-slate-900/90 border border-border/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all text-foreground placeholder:text-muted-foreground/50 shadow-xs"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Description <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief description of these programs..."
                    className="w-full p-3.5 text-sm rounded-xl bg-secondary/40 dark:bg-slate-900/90 border border-border/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all text-foreground placeholder:text-muted-foreground/50 shadow-xs resize-none"
                  />
                </div>

                {/* Select Workspace Programs */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>Select Programs from Your Workspace</span>
                      <span className="text-rose-500">*</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                        {selectedProgramIds.length} selected
                      </span>
                    </label>

                    {workspacePrograms.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-primary hover:underline font-medium cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-muted-foreground">•</span>
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Program filter */}
                  {workspacePrograms.length > 3 && (
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
                      <input
                        type="text"
                        value={programSearch}
                        onChange={(e) => setProgramSearch(e.target.value)}
                        placeholder="Filter your programs..."
                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary/40 dark:bg-slate-900/90 border border-border/70 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-xs"
                      />
                    </div>
                  )}

                  {/* List */}
                  <div className="border border-border/70 rounded-xl overflow-hidden max-h-52 overflow-y-auto bg-card divide-y divide-border/40">
                    {loadingWorkspace ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                        <span>Loading your workspace programs...</span>
                      </div>
                    ) : workspacePrograms.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                        <Code2 className="w-8 h-8 mx-auto text-primary opacity-40" />
                        <p className="font-semibold text-foreground">No programs found in your workspace</p>
                        <p>Create C programs in your Workspace or import algorithms from the DSA Library.</p>
                      </div>
                    ) : filteredWorkspacePrograms.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No programs match &quot;{programSearch}&quot;
                      </div>
                    ) : (
                      filteredWorkspacePrograms.map((prog) => {
                        const isChecked = selectedProgramIds.includes(prog.id);
                        return (
                          <div
                            key={prog.id}
                            onClick={() => handleToggleProgram(prog.id)}
                            className={`p-3 flex items-center justify-between cursor-pointer transition-colors text-xs select-none ${
                              isChecked
                                ? "bg-primary/10 text-foreground font-medium"
                                : "hover:bg-secondary/50 text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                  isChecked
                                    ? "bg-primary border-primary text-white"
                                    : "border-muted-foreground/40 bg-card"
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>

                              <FileCode className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-mono text-xs truncate">
                                {prog.title}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                              C11
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || selectedProgramIds.length === 0}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Publish Collection ({selectedProgramIds.length})</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

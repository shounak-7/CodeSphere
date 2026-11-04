"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  FolderArchive,
  Code2,
  Share2,
  FolderInput,
  Trash2,
  ChevronRight,
  Loader2,
  FileCode,
  X,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToastStore } from "@/lib/store/useToastStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { VerifiedBadge, isTeamAccount, isVerifiedAccount } from "@/components/ui/VerifiedBadge";
import { createClient } from "@/lib/supabase/client";
import { VSCodeSyntaxViewer } from "@/components/explore/VSCodeSyntaxViewer";

interface CollectionProgram {
  id: string;
  title: string;
  description?: string;
  source_code: string;
  category?: string;
  created_at?: string;
}

interface CollectionDetail {
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
  programs: CollectionProgram[];
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<CollectionProgram | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "code">("list");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; username?: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const username =
          (user.user_metadata?.user_name as string) ||
          (user.user_metadata?.username as string) ||
          user.email?.split("@")[0] ||
          "";
        setCurrentUser({ id: user.id, username });
      }
    });

    fetch("/api/profiles/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.profile) {
          setCurrentUser((prev) => ({
            id: data.profile.id || prev?.id || "",
            username: data.profile.username || prev?.username,
          }));
        }
      })
      .catch(() => {});

    fetch(`/api/collections/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.collection) {
          setCollection(data.collection);
          if (data.collection.programs?.length > 0) {
            setSelectedProgram(data.collection.programs[0]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    useToastStore.getState().addToast("Collection link copied to clipboard!", "success");
  };

  const handleImportToWorkspace = async (prog: CollectionProgram) => {
    if (!currentUser?.id) {
      useToastStore.getState().addToast("Please sign in to save programs to your workspace.", "warning");
      return;
    }
    setImportingId(prog.id);
    try {
      const filename = prog.title.endsWith(".c") ? prog.title : `${prog.title}.c`;
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: filename,
          source_code: prog.source_code,
          category: prog.category || "DSA",
          description: `Imported from collection: "${collection?.title}"`,
        }),
      });

      if (res.ok) {
        useToastStore
          .getState()
          .addToast(`Saved "${filename}" to your Workspace! Editable copy ready.`, "success");
      } else {
        const data = await res.json();
        useToastStore.getState().addToast(data.error || "Failed to import to workspace", "error");
      }
    } catch {
      useToastStore.getState().addToast("Network error importing to workspace", "error");
    } finally {
      setImportingId(null);
    }
  };

  const confirmDeleteCollection = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteModal(false);
        useToastStore.getState().addToast("Collection deleted successfully", "success");
        router.push("/collections");
      } else {
        useToastStore.getState().addToast("Failed to delete collection", "error");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
          <div className="h-28 bg-card rounded-2xl border border-border/70" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 h-96 bg-card rounded-2xl border border-border/70" />
            <div className="lg:col-span-7 h-96 bg-card rounded-2xl border border-border/70" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!collection) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-24 text-center px-4">
          <FolderArchive className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
          <h2 className="text-xl font-bold text-foreground">Collection Not Found</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            This collection does not exist or has been removed.
          </p>
          <Link
            href="/collections"
            className="mt-5 inline-block px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-xs"
          >
            Back to Collections
          </Link>
        </div>
      </AppShell>
    );
  }

  const isOwner = Boolean(
    currentUser &&
      (currentUser.id === collection.owner_id ||
        currentUser.id === "default-user" ||
        currentUser.id === "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1" ||
        (currentUser.username &&
          collection.owner?.username &&
          currentUser.username.toLowerCase() === collection.owner.username.toLowerCase()) ||
        currentUser.username?.toLowerCase() === "codesphere" ||
        currentUser.username?.toLowerCase() === "team")
  );
  const authorUsername = collection.owner?.username || "developer";
  const isVerified = isVerifiedAccount(collection.owner);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 lg:py-8 space-y-3.5 sm:space-y-6">
        {/* Navigation Breadcrumb */}
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-muted-foreground select-none overflow-x-auto scrollbar-none py-0.5"
        >
          <Link href="/collections" className="hover:text-foreground transition-colors shrink-0">
            Collections
          </Link>
          <ChevronRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground/40 shrink-0" />
          <span className="font-semibold text-foreground truncate">{collection.title}</span>
        </nav>

        {/* Collection Header Banner */}
        <div className="rounded-xl sm:rounded-2xl border border-border/70 dark:border-white/[0.08] bg-card p-3.5 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <FolderArchive className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>
                  {collection.programs?.length || 0}{" "}
                  {collection.programs?.length === 1 ? "Program" : "Programs"}
                </span>
              </span>

              <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {collection.title}
              </h1>

              {collection.description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {collection.description}
                </p>
              )}
            </div>

            {/* Actions: Share & Delete */}
            <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                title="Share Collection Link"
              >
                <Share2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>Share</span>
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                  title="Delete Collection"
                >
                  <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border/40 text-[11px] sm:text-xs text-muted-foreground">
            <Link
              href={`/profile/${authorUsername}`}
              className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity font-medium text-foreground"
            >
              <UserAvatar
                src={collection.owner?.avatar_url}
                alt={authorUsername}
                size="xs"
              />
              <div className="flex items-center gap-1">
                <span>@{authorUsername}</span>
                {isVerified && <VerifiedBadge size="sm" isTeam={isTeamAccount(authorUsername)} />}
              </div>
            </Link>
            <span>•</span>
            <span>Published {formatDate(collection.created_at)}</span>
          </div>
        </div>

        {/* Mobile View Toggle Pill (< lg: screens only) */}
        <div className="lg:hidden flex items-center justify-center">
          <div className="inline-flex items-center bg-secondary/80 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-border">
            <button
              type="button"
              onClick={() => setMobileTab("list")}
              className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                mobileTab === "list"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Programs ({collection.programs?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("code")}
              className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                mobileTab === "code"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Code Viewer
            </button>
          </div>
        </div>

        {/* Programs Split View: List on left, VS Code Code Viewer on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 items-start">
          {/* Programs List (4 cols on lg) */}
          <div className={`lg:col-span-4 space-y-1.5 sm:space-y-2 ${mobileTab === "list" ? "block" : "hidden lg:block"}`}>
            <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1">
              Programs ({collection.programs?.length || 0})
            </h2>

            {(!collection.programs || collection.programs.length === 0) ? (
              <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border/70 bg-card text-center text-xs text-muted-foreground">
                No programs in this folder.
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {collection.programs.map((prog) => {
                  const isSelected = selectedProgram?.id === prog.id;
                  return (
                    <div
                      key={prog.id}
                      onClick={() => {
                        setSelectedProgram(prog);
                        setMobileTab("code");
                      }}
                      className={`p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border/60 bg-card hover:bg-secondary/60 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 sm:gap-2 truncate">
                          <FileCode className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary shrink-0" />
                          <span className="font-mono text-[11px] sm:text-xs truncate">{prog.title}</span>
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                          C11
                        </span>
                      </div>
                      {prog.description && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 mt-1 pl-5 sm:pl-6">
                          {prog.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* VS Code Code Viewer Panel (8 cols on lg) */}
          <div className={`lg:col-span-8 space-y-3 ${mobileTab === "code" ? "block" : "hidden lg:block"}`}>
            {selectedProgram ? (
              <div className="space-y-3">
                {/* Action Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileTab("list")}
                      className="lg:hidden px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80"
                    >
                      ← Back to list
                    </button>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {selectedProgram.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={importingId === selectedProgram.id}
                      onClick={() => handleImportToWorkspace(selectedProgram)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 cursor-pointer transition-all disabled:opacity-50"
                      title="Import editable copy into your personal workspace"
                    >
                      {importingId === selectedProgram.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FolderInput className="w-3.5 h-3.5" />
                      )}
                      <span>Import to Workspace</span>
                    </button>
                  </div>
                </div>

                {/* VS Code Syntax Color-Coded Viewer */}
                <VSCodeSyntaxViewer
                  code={selectedProgram.source_code}
                  filename={selectedProgram.title}
                  maxHeight="540px"
                />
              </div>
            ) : (
              <div className="h-96 rounded-2xl border border-border/70 bg-card flex flex-col items-center justify-center text-xs text-muted-foreground p-6 text-center space-y-2">
                <Code2 className="w-8 h-8 text-primary opacity-40" />
                <p>Select a program from the left to view its source code.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pop-Out Deletion Confirmation Dialog */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete Collection?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Are you sure you want to delete <strong className="text-foreground">&ldquo;{collection.title}&rdquo;</strong>? This public folder will be removed.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDeleteCollection}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{deleting ? "Deleting..." : "Delete Collection"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

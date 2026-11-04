"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useUserStore } from "@/lib/store/useUserStore";
import {
  Search,
  Code2,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { DSA_LIBRARY, DSA_TOPICS, DSALibraryProgram } from "@/lib/data/dsaLibrary";
import { DSALibraryModal } from "@/components/explore/DSALibraryModal";
import { FolderCard } from "@/components/explore/FolderCard";
import { ProgramCard } from "@/components/explore/ProgramCard";
import { useToastStore } from "@/lib/store/useToastStore";
import { ScrollableNav } from "@/components/ui/ScrollableNav";
import { createClient } from "@/lib/supabase/client";

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFolder = searchParams.get("folder") || null;

  // Active folder selection (null = show all folder cards; topicId = show folder contents)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolder);

  // Category filter on main folder grid ("all", "Data Structures", "Algorithms", "Core Concepts")
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [activeModalProgram, setActiveModalProgram] = useState<DSALibraryProgram | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const currentUserId = useUserStore((s) => s.user?.id) || null;

  // Sync state if URL search params change
  useEffect(() => {
    const folderParam = searchParams.get("folder");
    if (folderParam) {
      setActiveFolderId(folderParam);
    } else {
      setActiveFolderId(null);
    }
  }, [searchParams]);

  // Select a folder and update URL
  const handleOpenFolder = (folderId: string) => {
    setActiveFolderId(folderId);
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("folder", folderId);
    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  // Back to folder listing
  const handleBackToFolders = () => {
    setActiveFolderId(null);
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("folder");
    router.push(params.toString() ? `/explore?${params.toString()}` : "/explore", { scroll: false });
  };

  // Find active topic object
  const activeTopic = useMemo(() => {
    if (!activeFolderId) return null;
    return DSA_TOPICS.find((t) => t.id === activeFolderId) || null;
  }, [activeFolderId]);

  // Dynamic program counts per topic
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const topic of DSA_TOPICS) {
      counts[topic.id] = DSA_LIBRARY.filter((p) => p.topicId === topic.id).length;
    }
    return counts;
  }, []);

  // Compute operations preview tags per topic for folder card tags
  const topicOperations = useMemo(() => {
    const ops: Record<string, string[]> = {};
    for (const topic of DSA_TOPICS) {
      const progs = DSA_LIBRARY.filter((p) => p.topicId === topic.id);
      const allOps = progs.flatMap((p) => p.operations);
      ops[topic.id] = Array.from(new Set(allOps));
    }
    return ops;
  }, []);

  // Categories list for folder filtering
  const categories = useMemo(() => {
    const set = new Set(DSA_TOPICS.map((t) => t.category));
    return ["all", ...Array.from(set)];
  }, []);

  // Filtered topics on the main folder grid
  const filteredTopics = useMemo(() => {
    return DSA_TOPICS.filter((t) => {
      if (selectedCategory !== "all" && t.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [selectedCategory]);

  // Filtered programs inside active folder or across all folders when global searching
  const filteredPrograms = useMemo(() => {
    return DSA_LIBRARY.filter((p) => {
      if (activeFolderId && p.topicId !== activeFolderId) {
        return false;
      }

      if (selectedDifficulty !== "all" && p.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = p.title.toLowerCase().includes(q);
        const inFilename = p.filename.toLowerCase().includes(q);
        const inSubtopic = p.subtopic.toLowerCase().includes(q);
        const inSummary = p.summary.toLowerCase().includes(q);
        const inOperations = p.operations.some((op) => op.toLowerCase().includes(q));
        const inFunctions = p.functions.some((fn) => fn.name.toLowerCase().includes(q));
        const inTopic = p.topic.toLowerCase().includes(q);
        return inTitle || inFilename || inSubtopic || inSummary || inOperations || inFunctions || inTopic;
      }

      return true;
    });
  }, [activeFolderId, selectedDifficulty, searchQuery]);

  // Import a DSA Library program to user's personal workspace
  const handleImportToWorkspace = async (program: DSALibraryProgram) => {
    if (!currentUserId) {
      useToastStore
        .getState()
        .addToast("Please sign in to save programs to your workspace.", "warning");
      return;
    }

    setImportingId(program.id);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: program.filename,
          source_code: program.code,
          description: `Imported from DSA Library: ${program.title}`,
          category: program.topic,
          tags: ["dsa-library", program.topicId, program.difficulty.toLowerCase()],
        }),
      });

      if (res.ok) {
        useToastStore.getState().addToast(
          `Imported "${program.filename}" to your Workspace! An independent, editable copy is ready.`,
          "success"
        );
      } else {
        const data = await res.json();
        useToastStore
          .getState()
          .addToast(
            data.error || "Please sign in to save programs to your workspace.",
            res.status === 401 ? "warning" : "error"
          );
      }
    } catch {
      useToastStore.getState().addToast("Network error importing program", "error");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 lg:py-8 space-y-4 sm:space-y-8">
        {/* ========================================================= */}
        {/* SCENARIO A: AN INDIVIDUAL FOLDER IS ACTIVE                */}
        {/* ========================================================= */}
        {activeTopic ? (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            {/* Minimal Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumbs"
              className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-muted-foreground select-none overflow-x-auto scrollbar-none py-0.5"
            >
              <button
                type="button"
                onClick={handleBackToFolders}
                className="hover:text-foreground transition-colors cursor-pointer shrink-0"
              >
                Explore
              </button>
              <ChevronRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground/40 shrink-0" />
              <span className="text-muted-foreground/70 shrink-0">{activeTopic.category}</span>
              <ChevronRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground/40 shrink-0" />
              <span className="font-semibold text-foreground truncate">{activeTopic.name}</span>
            </nav>

            {/* Folder Header */}
            <div className="rounded-xl sm:rounded-2xl border border-border/70 dark:border-white/[0.08] bg-card p-3.5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={handleBackToFolders}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                      <span>Back</span>
                    </button>
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground bg-secondary/60 px-2 sm:px-2.5 py-0.5 rounded-md">
                      {activeTopic.category}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground pt-0.5 sm:pt-1">
                    {activeTopic.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    {activeTopic.description}
                  </p>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground bg-secondary/60 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg inline-flex items-center gap-1.5">
                    <FolderOpen className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary" />
                    <span>{topicCounts[activeTopic.id] || 0} implementations</span>
                  </span>
                </div>
              </div>

              {/* Scoped Search & Difficulty Filter */}
              <div className="mt-3.5 sm:mt-6 pt-3 sm:pt-5 border-t border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search in ${activeTopic.name} by function or operation...`}
                    className="w-full h-8 sm:h-10 pl-8 sm:pl-10 pr-8 sm:pr-9 rounded-lg sm:rounded-xl bg-secondary/40 border border-border/60 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-44 shrink-0">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full h-8 sm:h-10 px-2.5 sm:px-3 rounded-lg sm:rounded-xl bg-secondary/40 border border-border/60 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-xs"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Programs Counter */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground px-1">
              <span>
                Showing <strong>{filteredPrograms.length}</strong> program{filteredPrograms.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={handleBackToFolders}
                className="hover:text-foreground transition-colors flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>All topic folders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Programs Grid */}
            {filteredPrograms.length === 0 ? (
              <div className="rounded-xl sm:rounded-2xl border border-border/70 bg-card p-6 sm:p-12 text-center text-muted-foreground space-y-2 sm:space-y-3">
                <Code2 className="w-7 sm:w-9 h-7 sm:h-9 mx-auto text-primary opacity-40" />
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  No implementations found
                </h3>
                <p className="text-[11px] sm:text-xs max-w-sm mx-auto">
                  No programs matched your filter criteria. Try clearing the search query or difficulty filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedDifficulty("all");
                  }}
                  className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredPrograms.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    onInspect={(p) => setActiveModalProgram(p)}
                    onImport={handleImportToWorkspace}
                    isImporting={importingId === program.id}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* SCENARIO B: MAIN EXPLORE DSA LIBRARY (ALL FOLDERS)        */
          /* ========================================================= */
          <div className="space-y-4 sm:space-y-7">
            {/* 1. Clean, Compact Page Heading */}
            <div className="space-y-0.5 sm:space-y-1">
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
                Explore DSA Library
              </h1>
              <p className="text-[11px] sm:text-sm text-muted-foreground">
                A curated collection of essential Data Structures & Algorithms implemented in standard C.
              </p>
            </div>

            {/* 2. Prominent Search Bar & Difficulty Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search algorithms, operations, or functions (e.g., BST, Merge Sort, Circular Queue)..."
                  className="w-full h-8 sm:h-11 pl-8 sm:pl-10 pr-8 sm:pr-9 rounded-lg sm:rounded-xl bg-card border border-border/70 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>
                )}
              </div>

              <div className="w-full sm:w-44 shrink-0">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full h-8 sm:h-11 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl bg-card border border-border/70 text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 cursor-pointer shadow-xs transition-all"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* 3. Global Search Results View OR Clean Category Folder Grid */}
            {searchQuery.trim() ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground px-1">
                  <span>
                    Found <strong>{filteredPrograms.length}</strong> program{filteredPrograms.length === 1 ? "" : "s"} matching &quot;{searchQuery}&quot;
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>

                {filteredPrograms.length === 0 ? (
                  <div className="rounded-xl sm:rounded-2xl border border-border/70 bg-card p-6 sm:p-12 text-center text-muted-foreground space-y-2 sm:space-y-3">
                    <Code2 className="w-7 sm:w-9 h-7 sm:h-9 mx-auto text-primary opacity-40" />
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">
                      No programs match &quot;{searchQuery}&quot;
                    </h3>
                    <p className="text-[11px] sm:text-xs max-w-sm mx-auto">
                      Try searching by general terms like &quot;tree&quot;, &quot;queue&quot;, &quot;linked list&quot;, or &quot;sort&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {filteredPrograms.map((program) => (
                      <ProgramCard
                        key={program.id}
                        program={program}
                        showFolderBadge={true}
                        onSelectFolder={(fId) => handleOpenFolder(fId)}
                        onInspect={(p) => setActiveModalProgram(p)}
                        onImport={handleImportToWorkspace}
                        isImporting={importingId === program.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5 sm:space-y-6">
                {/* Simplified Category Filter Pills */}
                <ScrollableNav className="pb-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const label = cat === "all" ? "All Folders" : cat;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </ScrollableNav>

                {/* Responsive 3-Column Grid for Topic Folders */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {filteredTopics.map((topic) => (
                    <FolderCard
                      key={topic.id}
                      topic={topic}
                      programCount={topicCounts[topic.id] || 0}
                      operationsPreview={topicOperations[topic.id] || []}
                      onClick={() => handleOpenFolder(topic.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Read-Only Study Modal */}
      <DSALibraryModal
        program={activeModalProgram}
        onClose={() => setActiveModalProgram(null)}
        onImport={handleImportToWorkspace}
        isImporting={importingId === activeModalProgram?.id}
      />
    </AppShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </AppShell>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}

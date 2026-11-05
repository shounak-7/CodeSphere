"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { VersionHistoryModal } from "@/components/workspace/VersionHistoryModal";
import { UnifiedTerminal } from "@/components/compiler/UnifiedTerminal";
import { WorkspaceExplorerTree } from "@/components/workspace/WorkspaceExplorerTree";
import { EditorTabsBar } from "@/components/workspace/EditorTabsBar";
import { WorkspaceActionsMenu } from "@/components/workspace/WorkspaceActionsMenu";
import { useWorkspaceStore, Program, Folder } from "@/lib/store/useWorkspaceStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useCompilerRunner } from "@/lib/compiler/useCompilerRunner";
import {
  Play,
  Square,
  Save,
  Plus,
  FolderPlus,
  FileCode,
  Terminal as TerminalIcon,
  Search,
  PanelLeftClose,
  PanelLeft,
  Compass,
  FolderArchive,
  MessageSquare,
  User,
  Settings,
  Check,
  Menu,
  WrapText,
} from "lucide-react";

export default function WorkspacePage() {
  const {
    programs,
    folders,
    activeProgram,
    activeCode,
    isDirty,
    isSaving,
    lastSavedAt,
    searchQuery,
    setPrograms,
    setFolders,
    setActiveProgram,
    setActiveCode,
    setIsDirty,
    setIsSaving,
    setLastSavedAt,
    setSearchQuery,
  } = useWorkspaceStore();

  const {
    stdout,
    stderr,
    terminalEntries,
    problems,
    isRunning,
    status: executionStatus,
    exitCode,
    durationMs,
    runCode,
    sendInput,
    sendEof,
    killSession,
    clearTerminal,
  } = useCompilerRunner();

  // Layout & UI states
  const [openProgramIds, setOpenProgramIds] = useState<string[]>(() =>
    activeProgram ? [activeProgram.id] : programs.length > 0 ? [programs[0].id] : []
  );
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(250);
  const [isDraggingExplorer, setIsDraggingExplorer] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(260);
  const [batchStdin, setBatchStdin] = useState("");
  const [mobileView, setMobileView] = useState<"files" | "editor" | "terminal">("editor");
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  // Word wrap preference (defaults to true on narrow mobile screens, false on desktop; persisted in localStorage)
  const [wordWrap, setWordWrap] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("codesphere_word_wrap");
      if (saved !== null) {
        setWordWrap(saved === "true");
      } else {
        setWordWrap(window.innerWidth < 768);
      }
    }
  }, []);

  const toggleWordWrap = useCallback(() => {
    setWordWrap((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("codesphere_word_wrap", String(next));
        } catch {}
      }
      setTimeout(() => {
        useToastStore
          .getState()
          .addToast(
            next ? "Word wrap enabled (lines wrap to screen)" : "Word wrap disabled (horizontal scroll)",
            "info"
          );
      }, 0);
      return next;
    });
  }, []);

  // Modals
  const [showVersionModal, setShowVersionModal] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const explorerDragRef = useRef<{ startX: number; startW: number } | null>(null);

  const initialDataLoadedRef = useRef(false);

  // Load initial workspace data from API (once on mount)
  useEffect(() => {
    if (initialDataLoadedRef.current) return;
    initialDataLoadedRef.current = true;

    async function loadWorkspaceData() {
      try {
        const [progRes, foldRes] = await Promise.all([
          fetch("/api/programs"),
          fetch("/api/folders"),
        ]);
        const progData = await progRes.json();
        const foldData = await foldRes.json();

        if (foldData.folders) {
          setFolders(foldData.folders);
        }

        if (progData.programs && progData.programs.length > 0) {
          setPrograms(progData.programs);

          // Check if a specific programId was requested in the URL (e.g. from profile "Open Code")
          const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const requestedId = urlParams?.get("programId");

          if (requestedId) {
            const matched = progData.programs.find((p: Program) => p.id === requestedId);
            if (matched) {
              setActiveProgram(matched);
              setOpenProgramIds([matched.id]);
              return;
            } else {
              // Fetch public program from API if not yet in local user list
              try {
                const singleRes = await fetch(`/api/programs/${requestedId}`);
                if (singleRes.ok) {
                  const singleData = await singleRes.json();
                  if (singleData.program) {
                    setPrograms([singleData.program, ...progData.programs]);
                    setActiveProgram(singleData.program);
                    setOpenProgramIds([singleData.program.id]);
                    return;
                  }
                }
              } catch {}
            }
          }

          // Fallback to first program if no requestedId and no program is active yet
          if (!activeProgram) {
            const first = progData.programs[0];
            setActiveProgram(first);
            setOpenProgramIds((prev) => (prev.length > 0 ? prev : [first.id]));
          }
        }
      } catch (err) {
        console.warn("Failed to load workspace data:", err);
      }
    }

    loadWorkspaceData();
  }, [setActiveProgram, setFolders, setPrograms]);

  // Keep open tabs synchronized with active program without duplicates
  useEffect(() => {
    if (activeProgram?.id) {
      setOpenProgramIds((prev) => Array.from(new Set([...prev, activeProgram.id])));
    }
  }, [activeProgram?.id]);

  // Proactively wake up and warm the Render compiler engine upon entering workspace,
  // and send a heartbeat ping every 10 minutes to nullify Render's free tier sleep timeout.
  useEffect(() => {
    fetch("/api/compiler/ping").catch(() => {});
    const heartbeat = setInterval(() => {
      fetch("/api/compiler/ping").catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(heartbeat);
  }, []);

  // Autosave implementation with debouncing (2 seconds after typing stops)
  useEffect(() => {
    if (!activeProgram || !isDirty) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      handleSave(false);
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [activeCode, isDirty]);

  // Explorer horizontal resize dragging
  const handleExplorerMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingExplorer(true);
    explorerDragRef.current = { startX: e.clientX, startW: explorerWidth };
    let rafId: number | null = null;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!explorerDragRef.current) return;
      const deltaX = moveEvent.clientX - explorerDragRef.current.startX;
      const nextWidth = Math.min(Math.max(180, explorerDragRef.current.startW + deltaX), 450);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setExplorerWidth(nextWidth);
      });
    };

    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsDraggingExplorer(false);
      explorerDragRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Toggle folder collapse state
  const handleToggleFolder = (folderId: string) => {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleExpandAllFolders = () => {
    setCollapsedFolderIds(new Set());
    useToastStore.getState().addToast("Expanded all folders", "info");
  };

  const handleCollapseAllFolders = () => {
    setCollapsedFolderIds(new Set(folders.map((f) => f.id)));
    useToastStore.getState().addToast("Collapsed all folders", "info");
  };

  // Save current active program
  const handleSave = async (showFeedback = true) => {
    if (!activeProgram) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/programs/${activeProgram.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeProgram.title,
          source_code: activeCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.program) {
        setIsDirty(false);
        setLastSavedAt(new Date());
        setPrograms(programs.map((p) => (p.id === data.program.id ? data.program : p)));
        setActiveProgram(data.program);
        if (showFeedback) {
          useToastStore.getState().addToast("Program saved successfully", "success");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Create new C program
  const handleCreateProgram = (folderId?: string | null) => {
    useToastStore.getState().openPrompt({
      title: "New C Program",
      placeholder: "e.g. DoublyLinkedList.c, binary_search.c",
      defaultValue: "program.c",
      confirmLabel: "Create File",
      onConfirm: async (enteredTitle) => {
        let title = enteredTitle.trim() || "Untitled.c";
        if (!title.endsWith(".c")) {
          title = `${title}.c`;
        }
        try {
          const res = await fetch("/api/programs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              category: "DSA",
              folder_id: folderId || null,
            }),
          });
          const data = await res.json();
          if (res.ok && data.program) {
            setPrograms([data.program, ...programs]);
            setActiveProgram(data.program);
            setOpenProgramIds((prev) => [...prev, data.program.id]);
            if (folderId) {
              setCollapsedFolderIds((prev) => {
                const next = new Set(prev);
                next.delete(folderId);
                return next;
              });
            }
            useToastStore.getState().addToast(`Created "${title}"`, "success");
          } else {
            useToastStore.getState().addToast("Failed to create program", "error");
          }
        } catch {
          useToastStore.getState().addToast("Failed to create program", "error");
        }
      },
    });
  };

  // Create new folder or subfolder
  const handleCreateFolder = (parentId?: string | null) => {
    useToastStore.getState().openPrompt({
      title: parentId ? "New Subfolder" : "New Folder",
      placeholder: "e.g. Trees, Algorithms, Homework",
      defaultValue: "New Folder",
      confirmLabel: "Create Folder",
      onConfirm: async (enteredName) => {
        const name = enteredName.trim() || "New Folder";
        try {
          const res = await fetch("/api/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              parent_id: parentId || null,
            }),
          });
          const data = await res.json();
          if (res.ok && data.folder) {
            setFolders([...folders, data.folder]);
            if (parentId) {
              setCollapsedFolderIds((prev) => {
                const next = new Set(prev);
                next.delete(parentId);
                return next;
              });
            }
            useToastStore.getState().addToast(`Created folder "${name}"`, "success");
          } else {
            useToastStore.getState().addToast("Failed to create folder", "error");
          }
        } catch {
          useToastStore.getState().addToast("Failed to create folder", "error");
        }
      },
    });
  };

  // Move program into another folder or root
  const handleMoveProgram = async (programId: string, targetFolderId: string | null) => {
    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: targetFolderId }),
      });
      if (res.ok) {
        setPrograms(
          programs.map((p) => (p.id === programId ? { ...p, folder_id: targetFolderId } : p))
        );
        if (activeProgram?.id === programId) {
          setActiveProgram({ ...activeProgram, folder_id: targetFolderId });
        }
        const targetFolderName = targetFolderId
          ? folders.find((f) => f.id === targetFolderId)?.name || "Folder"
          : "Root Directory";
        useToastStore.getState().addToast(`Moved file to ${targetFolderName}`, "success");
      }
    } catch {
      useToastStore.getState().addToast("Failed to move file", "error");
    }
  };

  // Rename program (keeps Editor tabs & Explorer synchronized)
  const handleRenameProgram = async (programId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const finalTitle = newTitle.endsWith(".c") ? newTitle : `${newTitle}.c`;

    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: finalTitle }),
      });
      if (res.ok) {
        setPrograms(
          programs.map((p) => (p.id === programId ? { ...p, title: finalTitle } : p))
        );
        if (activeProgram?.id === programId) {
          setActiveProgram({ ...activeProgram, title: finalTitle });
        }
        useToastStore.getState().addToast(`Renamed to "${finalTitle}"`, "success");
      }
    } catch {
      useToastStore.getState().addToast("Failed to rename program", "error");
    }
  };

  // Rename folder
  const handleRenameFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setFolders(
          folders.map((f) => (f.id === folderId ? { ...f, name: newName.trim() } : f))
        );
        useToastStore.getState().addToast(`Renamed folder to "${newName.trim()}"`, "success");
      }
    } catch {
      useToastStore.getState().addToast("Failed to rename folder", "error");
    }
  };

  // Delete folder
  const handleDeleteFolder = (folder: Folder) => {
    useToastStore.getState().openConfirm({
      title: "Delete Folder",
      message: `Are you sure you want to delete folder "${folder.name}"? Any programs inside it will be moved to the root directory.`,
      confirmLabel: "Delete Folder",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
          if (res.ok) {
            setFolders(folders.filter((f) => f.id !== folder.id));
            setPrograms(
              programs.map((p) => (p.folder_id === folder.id ? { ...p, folder_id: null } : p))
            );
            if (activeProgram?.folder_id === folder.id) {
              setActiveProgram({ ...activeProgram, folder_id: null });
            }
            useToastStore.getState().addToast(`Deleted folder "${folder.name}"`, "info");
          } else {
            useToastStore.getState().addToast("Failed to delete folder", "error");
          }
        } catch {
          useToastStore.getState().addToast("Failed to delete folder", "error");
        }
      },
    });
  };

  // Delete program
  const handleDeleteProgram = (prog?: Program) => {
    const target = prog || activeProgram;
    if (!target) return;

    useToastStore.getState().openConfirm({
      title: "Delete Program",
      message: `Are you sure you want to delete "${target.title}"? This cannot be undone.`,
      confirmLabel: "Delete Forever",
      isDestructive: true,
      onConfirm: async () => {
        const deletedId = target.id;
        const res = await fetch(`/api/programs/${deletedId}`, { method: "DELETE" });
        if (res.ok) {
          const remaining = programs.filter((p) => p.id !== deletedId);
          const remainingTabs = openProgramIds.filter((id) => id !== deletedId);
          setPrograms(remaining);
          setOpenProgramIds(remainingTabs);
          if (activeProgram?.id === deletedId) {
            setActiveProgram(remaining[0] || null);
          }
          useToastStore.getState().addToast("Program deleted", "info");
        } else {
          useToastStore.getState().addToast("Failed to delete program", "error");
        }
      },
    });
  };

  // Duplicate program
  const handleDuplicateProgram = async (prog?: Program) => {
    const target = prog || activeProgram;
    if (!target) return;

    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${target.title.replace(/\.c$/, "")}_copy.c`,
        source_code: target.id === activeProgram?.id ? activeCode : target.source_code,
        category: target.category,
        folder_id: target.folder_id,
      }),
    });
    const data = await res.json();
    if (res.ok && data.program) {
      setPrograms([data.program, ...programs]);
      setActiveProgram(data.program);
      setOpenProgramIds((prev) => [...prev, data.program.id]);
      useToastStore.getState().addToast("Program duplicated successfully", "success");
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (prog?: Program) => {
    const target = prog || activeProgram;
    if (!target) return;

    const nextVal = !target.is_favorite;
    const res = await fetch(`/api/programs/${target.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: nextVal }),
    });
    if (res.ok) {
      setPrograms(
        programs.map((p) => (p.id === target.id ? { ...p, is_favorite: nextVal } : p))
      );
      if (activeProgram?.id === target.id) {
        setActiveProgram({ ...activeProgram, is_favorite: nextVal });
      }
      useToastStore.getState().addToast(
        nextVal ? "Marked as favorite" : "Removed from favorites",
        "info"
      );
    }
  };

  // Toggle public/private visibility
  const handleToggleVisibility = async (prog?: Program) => {
    const target = prog || activeProgram;
    if (!target) return;

    const nextVis = target.visibility === "private" ? "public" : "private";
    const res = await fetch(`/api/programs/${target.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: nextVis }),
    });
    if (res.ok) {
      setPrograms(
        programs.map((p) => (p.id === target.id ? { ...p, visibility: nextVis } : p))
      );
      if (activeProgram?.id === target.id) {
        setActiveProgram({ ...activeProgram, visibility: nextVis });
      }
      useToastStore.getState().addToast(
        nextVis === "public" ? "Published to Community" : "Changed to Private",
        "success"
      );
    }
  };

  // Close single tab
  const handleCloseTab = (progId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openProgramIds.filter((id) => id !== progId);
    setOpenProgramIds(nextTabs);

    if (activeProgram?.id === progId) {
      if (nextTabs.length > 0) {
        const nextProg = programs.find((p) => p.id === nextTabs[nextTabs.length - 1]);
        setActiveProgram(nextProg || null);
      } else {
        setActiveProgram(null);
      }
    }
  };

  // Close other tabs
  const handleCloseOtherTabs = (keepProgId: string) => {
    setOpenProgramIds([keepProgId]);
    const target = programs.find((p) => p.id === keepProgId);
    if (target) setActiveProgram(target);
  };

  const handleRun = () => {
    runCode(activeCode, batchStdin);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileView("terminal");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode(activeCode, batchStdin);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setIsExplorerOpen((prev) => !prev);
      } else if (e.ctrlKey && e.key === "c" && isRunning) {
        e.preventDefault();
        killSession();
      } else if (e.altKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        toggleWordWrap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCode, batchStdin, runCode, isRunning, killSession, toggleWordWrap]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    useToastStore.getState().addToast("Code copied to clipboard!", "success");
  };

  const handleDownload = () => {
    if (!activeProgram) return;
    const blob = new Blob([activeCode], { type: "text/x-csrc" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeProgram.title.endsWith(".c") ? activeProgram.title : `${activeProgram.title}.c`;
    a.click();
    URL.revokeObjectURL(url);
    useToastStore.getState().addToast("Downloaded source file", "success");
  };

  return (
    <AppShell showSidebar={false}>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-background select-none">
        {/* ========================================================= */}
        {/* 1. SLIM VS CODE-STYLE ACTIVITY BAR (48px wide)            */}
        {/* ========================================================= */}
        <aside className="hidden md:flex w-12 border-r border-slate-200/90 dark:border-white/[0.08] bg-[#f8fafc] dark:bg-[#080d1a] flex-col justify-between items-center py-2.5 flex-shrink-0 z-20 select-none transition-colors">
          {/* Top Primary Actions */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            {/* 3-bar Menu button at the top of Activity Bar */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("toggle-sidebar"));
              }}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer"
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>

            {/* Explorer Toggle Button with VS Code Active Indicator Bar */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setMobileView(mobileView === "files" ? "editor" : "files");
                } else {
                  setIsExplorerOpen(!isExplorerOpen);
                }
              }}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                isExplorerOpen || mobileView === "files"
                  ? "bg-slate-200/90 dark:bg-white/[0.08] text-indigo-600 dark:text-white font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-indigo-600 dark:before:bg-indigo-400 before:rounded-r-md"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06]"
              }`}
              title="Explorer (Toggle files sidebar - Ctrl+B)"
              aria-label="Toggle Explorer"
            >
              <FileCode className="w-[18px] h-[18px]" />
            </button>

            {/* Community Feed */}
            <Link
              href="/feed"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
              title="Community Feed"
            >
              <Compass className="w-[18px] h-[18px]" />
            </Link>

            {/* Public Collections */}
            <Link
              href="/collections"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
              title="Public Collections"
            >
              <FolderArchive className="w-[18px] h-[18px]" />
            </Link>

            {/* Direct Messages */}
            <Link
              href="/messages"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
              title="Direct Messages"
            >
              <MessageSquare className="w-[18px] h-[18px]" />
            </Link>
          </div>

          {/* Bottom Settings & User Profile Actions */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="w-5 h-px bg-slate-200 dark:bg-white/[0.08] my-1" />

            <Link
              href="/settings"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
              title="Settings"
            >
              <Settings className="w-[18px] h-[18px]" />
            </Link>

            <Link
              href="/profile/me"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
              title="My Developer Profile"
            >
              <User className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* 2. COLLAPSIBLE & RESIZABLE VS CODE FILE EXPLORER          */}
        {/* ========================================================= */}
        {/* Desktop Explorer Panel (visible on lg: when isExplorerOpen) */}
        {isExplorerOpen && (
          <aside
            style={{ width: `${explorerWidth}px` }}
            className={`hidden lg:flex h-full flex-col border-r border-slate-200/70 dark:border-white/[0.08] bg-card/95 backdrop-blur-2xl shadow-none flex-shrink-0 z-10 relative ${
              isDraggingExplorer ? "transition-none select-none" : "transition-[width] duration-75"
            }`}
          >
            {/* Explorer Header */}
            <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between flex-shrink-0 bg-secondary/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                Explorer
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCreateProgram(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                  title="New C File (Ctrl+N)"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateFolder(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                  title="New Folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExplorerOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                  title="Collapse Explorer (Ctrl+B)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Programs */}
            <div className="p-2 border-b border-border/70">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter files..."
                  className="w-full h-7 pl-7 pr-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800/80 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 caret-indigo-600 dark:caret-indigo-400 shadow-inner"
                />
              </div>
            </div>

            {/* Hierarchical Folder & File Tree */}
            <WorkspaceExplorerTree
              programs={programs}
              folders={folders}
              activeProgram={activeProgram}
              collapsedFolderIds={collapsedFolderIds}
              searchQuery={searchQuery}
              onSelectProgram={setActiveProgram}
              onCreateProgram={handleCreateProgram}
              onCreateFolder={handleCreateFolder}
              onRenameProgram={handleRenameProgram}
              onRenameFolder={handleRenameFolder}
              onDeleteProgram={handleDeleteProgram}
              onDeleteFolder={handleDeleteFolder}
              onMoveProgram={handleMoveProgram}
              onDuplicateProgram={handleDuplicateProgram}
              onToggleFavorite={handleToggleFavorite}
              onToggleVisibility={handleToggleVisibility}
              onToggleFolder={handleToggleFolder}
            />

            {/* Draggable Right Resizer Handle */}
            <div
              onMouseDown={handleExplorerMouseDownResize}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-20"
              title="Drag to resize explorer"
            />
          </aside>
        )}

        {/* Mobile/Tablet Backdrop Overlay (covers remaining 30-40% of screen) */}
        {mobileView === "files" && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileView("editor")}
          />
        )}

        {/* Mobile/Tablet Drawer Files View (< lg: occupying 60% to 70% of screen) */}
        <div
          className={`lg:hidden fixed top-14 sm:top-16 bottom-0 left-0 z-50 w-[70%] sm:w-[65%] max-w-[340px] flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-card border-r border-border shadow-2xl transition-transform duration-200 ease-in-out ${
            mobileView === "files" ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
        >
          <div className="h-8 sm:h-10 px-2 sm:px-3 border-b border-border/70 flex items-center justify-between flex-shrink-0 bg-secondary/20">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
                Explorer
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">
                ({programs.length} files)
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => handleCreateProgram(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                title="New C File"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </button>
              <button
                type="button"
                onClick={() => handleCreateFolder(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                title="New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </button>
              <button
                type="button"
                onClick={() => setMobileView("editor")}
                className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 border-b border-border/70">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files..."
                className="w-full h-7 sm:h-8 pl-7 sm:pl-8 pr-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs bg-slate-100 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <WorkspaceExplorerTree
            programs={programs}
            folders={folders}
            activeProgram={activeProgram}
            collapsedFolderIds={collapsedFolderIds}
            searchQuery={searchQuery}
            onSelectProgram={(p) => {
              setActiveProgram(p);
              setMobileView("editor");
            }}
            onCreateProgram={handleCreateProgram}
            onCreateFolder={handleCreateFolder}
            onRenameProgram={handleRenameProgram}
            onRenameFolder={handleRenameFolder}
            onDeleteProgram={handleDeleteProgram}
            onDeleteFolder={handleDeleteFolder}
            onMoveProgram={handleMoveProgram}
            onDuplicateProgram={handleDuplicateProgram}
            onToggleFavorite={handleToggleFavorite}
            onToggleVisibility={handleToggleVisibility}
            onToggleFolder={handleToggleFolder}
          />
        </div>

        {/* ========================================================= */}
        {/* 3. MAIN WORKSPACE CANVAS (Monaco Editor & Terminal Console) */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
          {activeProgram ? (
            <>
              {/* TOP HEADER: File Tabs & Primary Actions Bar */}
              <div className="border-b border-border bg-card/80 backdrop-blur-md flex flex-wrap min-[520px]:flex-nowrap items-center justify-between gap-y-1 gap-x-1.5 px-1.5 sm:px-2 py-1 min-[520px]:py-0 min-[520px]:h-10 flex-shrink-0 select-none">
                {/* Left Controls: Switcher & Explorer restore button */}
                <div className="order-1 flex items-center gap-1.5 shrink-0">
                  {/* Collapsed Explorer Restore Button (desktop only) */}
                  {!isExplorerOpen && (
                    <button
                      type="button"
                      onClick={() => setIsExplorerOpen(true)}
                      className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary mr-1 cursor-pointer flex-shrink-0"
                      title="Open Explorer (Ctrl+B)"
                    >
                      <PanelLeft className="w-4 h-4 text-primary" />
                    </button>
                  )}

                  {/* Mobile View Switcher Pill (< lg: screens only) */}
                  <div className="lg:hidden flex items-center bg-secondary/80 rounded-lg sm:rounded-xl p-0.5 border border-border shrink-0">
                    <button
                      type="button"
                      onClick={() => setMobileView(mobileView === "files" ? "editor" : "files")}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                        mobileView === "files"
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Files
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileView("editor")}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                        mobileView === "editor"
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileView("terminal")}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        mobileView === "terminal"
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>Output</span>
                      {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                      {executionStatus === "error" && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    </button>
                  </div>
                </div>

                {/* Right: Primary Action Toolbar (Save & Run) */}
                <div className="order-2 min-[520px]:order-3 flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* Autosave status indicator (hidden on small mobile) */}
                  <div className="text-[11px] text-muted-foreground hidden lg:flex items-center gap-1.5 font-sans">
                    {isSaving ? (
                      <span className="text-yellow-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" /> Saving...
                      </span>
                    ) : isDirty ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Unsaved
                      </span>
                    ) : lastSavedAt ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Saved
                      </span>
                    ) : null}
                  </div>

                  {/* Toggle Word Wrap Option (Phones & PCs/Laptops) */}
                  <button
                    type="button"
                    onClick={toggleWordWrap}
                    className={`inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold border cursor-pointer transition-all active:scale-95 shadow-xs select-none ${
                      wordWrap
                        ? "bg-primary/15 text-primary border-primary/40 hover:bg-primary/25 font-bold"
                        : "bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                    }`}
                    title={`Toggle Word Wrap (${wordWrap ? "Enabled" : "Disabled"}) • Alt+Z`}
                    aria-label="Toggle Word Wrap"
                  >
                    <WrapText className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${wordWrap ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="hidden sm:inline">Wrap</span>
                    <span
                      className={`text-[8px] sm:text-[9px] px-1 py-0.2 rounded font-mono uppercase font-bold tracking-tight ${
                        wordWrap
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {wordWrap ? "on" : "off"}
                    </span>
                  </button>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-all active:scale-95 shadow-xs disabled:opacity-50"
                    title="Save Code (Ctrl+S)"
                    aria-label="Save Code"
                  >
                    <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                    <span className="hidden sm:inline">Save</span>
                  </button>

                  {/* Run / Stop GCC Execution Button */}
                  {isRunning ? (
                    <button
                      type="button"
                      onClick={killSession}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer border border-red-500/40 animate-pulse"
                      title="Stop / Terminate Process (Ctrl+C)"
                      aria-label="Stop Process"
                    >
                      <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRun}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer border border-emerald-500/40"
                      title="Compile & Run C Program (Ctrl+Enter)"
                      aria-label="Run GCC"
                    >
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                      <span>Run</span>
                      <span className="hidden xl:inline px-1 py-0.2 rounded bg-black/25 text-[10px] text-emerald-200 font-mono">
                        Ctrl+Enter
                      </span>
                    </button>
                  )}
                </div>

                {/* File Tabs Bar: On < 520px: occupies row 2 full width! On >= 520px: sits in middle */}
                <div className="order-3 min-[520px]:order-2 w-full min-[520px]:w-auto min-[520px]:flex-1 min-w-0 h-8 min-[520px]:h-full flex items-center border-t min-[520px]:border-t-0 border-border/40 mt-1 min-[520px]:mt-0 pt-0.5 min-[520px]:pt-0 overflow-hidden">
                  <EditorTabsBar
                    programs={programs}
                    openProgramIds={openProgramIds}
                    activeProgram={activeProgram}
                    isDirty={isDirty}
                    onSelectProgram={setActiveProgram}
                    onCloseTab={handleCloseTab}
                    onCloseOtherTabs={handleCloseOtherTabs}
                    onCreateProgram={() => handleCreateProgram(null)}
                    onRenameProgram={handleRenameProgram}
                    onSaveProgram={() => handleSave(true)}
                  />
                </div>
              </div>

              {/* EDITOR & INTERACTIVE TERMINAL VERTICAL CANVAS */}
              {/* Desktop layout: editor on top, terminal on bottom */}
              <div className="hidden lg:flex flex-1 flex-col overflow-hidden relative">
                <div className="flex-1 overflow-hidden bg-card">
                  <CodeEditor
                    code={activeCode}
                    onChange={(val) => setActiveCode(val || "")}
                    wordWrap={wordWrap ? "on" : "off"}
                  />
                </div>

                <UnifiedTerminal
                  stdout={stdout}
                  stderr={stderr}
                  terminalEntries={terminalEntries}
                  problems={problems}
                  isRunning={isRunning}
                  status={executionStatus}
                  exitCode={exitCode}
                  durationMs={durationMs}
                  height={terminalHeight}
                  onHeightChange={setTerminalHeight}
                  onClear={clearTerminal}
                  onRun={handleRun}
                  onSendInput={sendInput}
                  onSendEof={sendEof}
                  onKill={killSession}
                  batchStdin={batchStdin}
                  onBatchStdinChange={setBatchStdin}
                />
              </div>

              {/* Mobile / Tablet Responsive Mode (< lg:) */}
              <div className="lg:hidden flex-1 flex flex-col overflow-hidden relative">
                {(mobileView === "editor" || mobileView === "files") && (
                  <div className="flex-1 h-full overflow-hidden bg-card">
                    <CodeEditor
                      code={activeCode}
                      onChange={(val) => setActiveCode(val || "")}
                      wordWrap={wordWrap ? "on" : "off"}
                    />
                  </div>
                )}

                {mobileView === "terminal" && (
                  <div className="flex-1 h-full overflow-hidden bg-card flex flex-col">
                    <UnifiedTerminal
                      stdout={stdout}
                      stderr={stderr}
                      terminalEntries={terminalEntries}
                      problems={problems}
                      isRunning={isRunning}
                      status={executionStatus}
                      exitCode={exitCode}
                      durationMs={durationMs}
                      height="100%"
                      onClear={clearTerminal}
                      onRun={handleRun}
                      onSendInput={sendInput}
                      onSendEof={sendEof}
                      onKill={killSession}
                      batchStdin={batchStdin}
                      onBatchStdinChange={setBatchStdin}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State when no program is open */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <FileCode className="w-12 h-12 mb-3 text-primary opacity-60" />
              <h3 className="text-lg font-bold text-foreground">Welcome to your Personal C Workspace</h3>
              <p className="text-xs max-w-sm mt-1">
                Select a C program from the Explorer or create a new file to start coding and compiling.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => handleCreateProgram(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 cursor-pointer shadow-md shadow-primary/20"
                >
                  + Create New C Program
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView("files")}
                  className="lg:hidden px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer border border-border"
                >
                  Browse Files
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkpoints & Version History Modal */}
      {activeProgram && (
        <VersionHistoryModal
          isOpen={showVersionModal}
          onClose={() => setShowVersionModal(false)}
          programId={activeProgram.id}
          onRestore={(newCode) => {
            setActiveCode(newCode);
            handleSave(false);
          }}
        />
      )}
    </AppShell>
  );
}

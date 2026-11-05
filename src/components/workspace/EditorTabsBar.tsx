"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FileCode, X, Plus, Edit2, Save, Copy, ChevronLeft, ChevronRight, Pin } from "lucide-react";
import { Program, useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useToastStore } from "@/lib/store/useToastStore";

interface TabContextMenu {
  x: number;
  y: number;
  progId: string;
}

interface EditorTabsBarProps {
  programs: Program[];
  openProgramIds: string[];
  activeProgram: Program | null;
  isDirty: boolean;
  onSelectProgram: (p: Program) => void;
  onCloseTab: (progId: string, e: React.MouseEvent) => void;
  onCloseOtherTabs: (keepProgId: string) => void;
  onCreateProgram: () => void;
  onRenameProgram: (id: string, newTitle: string) => Promise<void>;
  onSaveProgram: () => void;
}

export function EditorTabsBar({
  programs,
  openProgramIds,
  activeProgram,
  isDirty,
  onSelectProgram,
  onCloseTab,
  onCloseOtherTabs,
  onCreateProgram,
  onRenameProgram,
  onSaveProgram,
}: EditorTabsBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [contextMenu, setContextMenu] = useState<TabContextMenu | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const pinnedItemIds = useWorkspaceStore((s) => s.pinnedItemIds) || [];
  const togglePinItem = useWorkspaceStore((s) => s.togglePinItem);

  const editInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(el);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [checkScroll, openProgramIds]);

  // Auto scroll active tab into view
  useEffect(() => {
    if (activeProgram && scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-tab-id="${activeProgram.id}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        setTimeout(checkScroll, 250);
      }
    }
  }, [activeProgram, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = direction === "left" ? -140 : 140;
    el.scrollBy({ left: delta, behavior: "smooth" });
    setTimeout(checkScroll, 200);
  };

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleClose = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setEditingTabId(null);
      }
    };
    document.addEventListener("mousedown", handleClose);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Autofocus inline rename input
  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTabId]);

  const handleStartRename = (prog: Program) => {
    setEditingTabId(prog.id);
    setEditingValue(prog.title);
    setContextMenu(null);
  };

  const handleFinishRename = async (progId: string) => {
    const trimmed = editingValue.trim();
    setEditingTabId(null);
    if (!trimmed) return;

    const finalTitle = trimmed.endsWith(".c") ? trimmed : `${trimmed}.c`;
    await onRenameProgram(progId, finalTitle);
  };

  return (
    <div className="relative flex items-center flex-1 min-w-0 w-full select-none">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="flex-shrink-0 z-10 p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer mr-0.5 bg-card/95 border border-border/70 shadow-xs active:scale-95 transition-all"
          title="Scroll tabs left"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Tabs list container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0 py-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {Array.from(new Set(openProgramIds)).map((progId) => {
          const prog = programs.find((p) => p.id === progId);
          if (!prog) return null;
          const isActive = activeProgram?.id === prog.id;
          const isEditing = editingTabId === prog.id;

          return (
            <div
              key={prog.id}
              data-tab-id={prog.id}
              onClick={() => onSelectProgram(prog)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartRename(prog);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: Math.min(e.clientX, window.innerWidth - 180),
                  y: Math.min(e.clientY, window.innerHeight - 150),
                  progId: prog.id,
                });
              }}
              className={`group flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium cursor-pointer transition-all border shrink-0 ${
                isActive
                  ? "bg-secondary text-foreground border-border/80 shadow-xs font-semibold"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/50 hover:text-foreground"
              }`}
              title="Click to switch, double-click to rename"
            >
              <FileCode
                className={`w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0 ${
                  isActive ? "text-primary" : "text-cyan-500/80"
                }`}
              />

              {isEditing ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => handleFinishRename(prog.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFinishRename(prog.id);
                    if (e.key === "Escape") setEditingTabId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 px-1 text-[11px] sm:text-xs rounded bg-card border border-primary text-foreground focus:outline-none w-24 sm:w-28"
                />
              ) : (
                <span className="truncate max-w-[130px] sm:max-w-[180px]">{prog.title}</span>
              )}

              {pinnedItemIds.includes(prog.id) && (
                <span title="Pinned file">
                  <Pin className="w-2.5 h-2.5 rotate-45 text-indigo-400 fill-indigo-400/30 flex-shrink-0" />
                </span>
              )}

              {/* Unsaved indicator dot */}
              {isActive && isDirty && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"
                  title="Unsaved changes"
                />
              )}

              {/* Close tab */}
              <button
                type="button"
                onClick={(e) => onCloseTab(prog.id, e)}
                className="p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* New file shortcut button on tab bar */}
        <button
          type="button"
          onClick={onCreateProgram}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer shrink-0 ml-0.5"
          title="New File"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="flex-shrink-0 z-10 p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer ml-0.5 bg-card/95 border border-border/70 shadow-xs active:scale-95 transition-all"
          title="Scroll tabs right"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Tab Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-44 rounded-xl border border-border bg-card shadow-2xl p-1.5 text-xs font-medium space-y-0.5 animate-in fade-in-50 zoom-in-95 backdrop-blur-md"
        >
          {/* Pin/Unpin Tab */}
          <button
            type="button"
            onClick={() => {
              togglePinItem(contextMenu.progId);
              const prog = programs.find((p) => p.id === contextMenu.progId);
              const isPinned = pinnedItemIds.includes(contextMenu.progId);
              useToastStore.getState().addToast(
                isPinned ? `Unpinned "${prog?.title || "file"}"` : `Pinned "${prog?.title || "file"}" to top`,
                "info"
              );
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <Pin className="w-3.5 h-3.5 rotate-45 text-indigo-400" />
            <span>{pinnedItemIds.includes(contextMenu.progId) ? "Unpin File" : "Pin File to Top"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const prog = programs.find((p) => p.id === contextMenu.progId);
              if (prog) handleStartRename(prog);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-primary" />
            <span>Rename Tab</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              onSaveProgram();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-primary" />
            <span>Save (Ctrl+S)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const prog = programs.find((p) => p.id === contextMenu.progId);
              setContextMenu(null);
              if (prog) {
                navigator.clipboard.writeText(prog.title);
                useToastStore.getState().addToast(`Copied "${prog.title}"`, "success");
              }
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-primary" />
            <span>Copy Name</span>
          </button>

          <div className="h-px bg-border my-1" />

          <button
            type="button"
            onClick={(e) => {
              const id = contextMenu.progId;
              setContextMenu(null);
              onCloseTab(id, e);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Tab</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const id = contextMenu.progId;
              setContextMenu(null);
              onCloseOtherTabs(id);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Close Other Tabs</span>
          </button>
        </div>
      )}
    </div>
  );
}

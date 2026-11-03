"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Plus,
  FolderPlus,
  Save,
  FolderOpen,
  FolderIcon,
  RefreshCw,
  History,
  Download,
  Copy,
  Trash2,
  CopyPlus,
  Star,
  Globe,
  Lock,
} from "lucide-react";
import { Program } from "@/lib/store/useWorkspaceStore";

interface WorkspaceActionsMenuProps {
  activeProgram: Program | null;
  onNewFile: () => void;
  onNewFolder: () => void;
  onSave: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRefresh: () => void;
  onOpenVersionModal: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onToggleVisibility: () => void;
  onDownload: () => void;
  onCopyCode: () => void;
  onDeleteProgram: () => void;
}

export function WorkspaceActionsMenu({
  activeProgram,
  onNewFile,
  onNewFolder,
  onSave,
  onExpandAll,
  onCollapseAll,
  onRefresh,
  onOpenVersionModal,
  onDuplicate,
  onToggleFavorite,
  onToggleVisibility,
  onDownload,
  onCopyCode,
  onDeleteProgram,
}: WorkspaceActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number }>({ top: 48, right: 16 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClose = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClose);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", handleScrollOrResize);
      window.addEventListener("scroll", handleScrollOrResize, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      {/* Three-dot trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
          isOpen
            ? "bg-secondary text-primary border-primary shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary border-border"
        }`}
        title="Workspace & File Actions"
        aria-label="Workspace Options Menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu - Fixed positioning with high z-index to prevent clipping and overlay issues */}
      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: `${menuCoords.top}px`,
            right: `${menuCoords.right}px`,
          }}
          className="fixed w-60 rounded-xl border border-border bg-card/95 shadow-2xl p-1.5 z-[9999] text-xs font-medium space-y-0.5 animate-in fade-in-50 zoom-in-95 backdrop-blur-xl"
        >
          {/* File Creation & Explorer Actions */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onNewFile();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>New C File</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Ctrl+N</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onNewFolder();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-3.5 h-3.5 text-primary" />
              <span>New Folder</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onSave();
            }}
            disabled={!activeProgram}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer disabled:opacity-40"
          >
            <div className="flex items-center gap-2">
              <Save className="w-3.5 h-3.5 text-primary" />
              <span>Save File</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Ctrl+S</span>
          </button>

          <div className="h-px bg-border my-1" />

          {/* Tree View Controls */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExpandAll();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Expand All Folders</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onCollapseAll();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <FolderIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Collapse All Folders</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onRefresh();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span>Refresh Explorer</span>
          </button>

          {/* Active File Actions */}
          {activeProgram && (
            <>
              <div className="h-px bg-border my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenVersionModal();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-primary" />
                <span>Version Checkpoints</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDuplicate();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <CopyPlus className="w-3.5 h-3.5 text-primary" />
                <span>Duplicate Program</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onToggleFavorite();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    activeProgram.is_favorite ? "fill-amber-400 text-amber-400" : "text-primary"
                  }`}
                />
                <span>{activeProgram.is_favorite ? "Remove Favorite" : "Mark as Favorite"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onToggleVisibility();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                {activeProgram.visibility === "private" ? (
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>{activeProgram.visibility === "private" ? "Publish to Community" : "Make Private"}</span>
              </button>

              <div className="h-px bg-border my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onCopyCode();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
                <span>Copy Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDownload();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Download .c</span>
              </button>

              <div className="h-px bg-border my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDeleteProgram();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Program</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

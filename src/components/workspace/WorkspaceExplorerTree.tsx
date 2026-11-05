"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Folder as FolderIcon,
  FolderOpen,
  FileCode,
  ChevronRight,
  MoreVertical,
  Plus,
  FolderPlus,
  Edit2,
  Trash2,
  CopyPlus,
  Star,
  Globe,
  Lock,
  Copy,
  CornerDownRight,
  FolderInput,
  Sparkles,
  Pin,
} from "lucide-react";
import { Program, Folder, useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useToastStore } from "@/lib/store/useToastStore";

interface ContextMenuState {
  type: "file" | "folder" | "root";
  x: number;
  y: number;
  item: Program | Folder | null;
}

interface WorkspaceExplorerTreeProps {
  programs: Program[];
  folders: Folder[];
  activeProgram: Program | null;
  collapsedFolderIds: Set<string>;
  searchQuery: string;
  onSelectProgram: (p: Program) => void;
  onCreateProgram: (folderId?: string | null) => void;
  onCreateFolder: (parentId?: string | null) => void;
  onRenameProgram: (id: string, title: string) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onDeleteProgram: (p: Program) => void;
  onDeleteFolder: (f: Folder) => void;
  onMoveProgram: (programId: string, targetFolderId: string | null) => Promise<void>;
  onMoveFolder?: (folderId: string, targetParentId: string | null) => Promise<void>;
  onDuplicateProgram: (p: Program) => void;
  onToggleFavorite: (p: Program) => void;
  onToggleVisibility: (p: Program) => void;
  onToggleFolder: (folderId: string) => void;
}

export function WorkspaceExplorerTree({
  programs,
  folders,
  activeProgram,
  collapsedFolderIds,
  searchQuery,
  onSelectProgram,
  onCreateProgram,
  onCreateFolder,
  onRenameProgram,
  onRenameFolder,
  onDeleteProgram,
  onDeleteFolder,
  onMoveProgram,
  onMoveFolder,
  onDuplicateProgram,
  onToggleFavorite,
  onToggleVisibility,
  onToggleFolder,
}: WorkspaceExplorerTreeProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | "root">(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: "file" | "folder"; title?: string } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);
  const dragCountersRef = useRef<Record<string, number>>({});
  const folderExpandTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pinnedItemIds = useWorkspaceStore((s) => s.pinnedItemIds) || [];
  const togglePinItem = useWorkspaceStore((s) => s.togglePinItem);

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
        setEditingItemId(null);
      }
    };
    const handleScrollOrResize = () => {
      setContextMenu(null);
    };

    document.addEventListener("mousedown", handleClose);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      if (folderExpandTimerRef.current) clearTimeout(folderExpandTimerRef.current);
    };
  }, []);

  // Autofocus inline editing input
  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingItemId]);

  const handleStartRename = (id: string, initialVal: string) => {
    setEditingItemId(id);
    setEditingValue(initialVal);
    setContextMenu(null);
  };

  const handleFinishRename = async (id: string, isFolder: boolean) => {
    const trimmed = editingValue.trim();
    setEditingItemId(null);
    if (!trimmed) return;

    if (isFolder) {
      await onRenameFolder(id, trimmed);
    } else {
      const finalTitle = trimmed.endsWith(".c") ? trimmed : `${trimmed}.c`;
      await onRenameProgram(id, finalTitle);
    }
  };

  // Open menu on three-dot button click
  const openMenuForButton = (
    e: React.MouseEvent<HTMLButtonElement>,
    type: "file" | "folder",
    item: Program | Folder
  ) => {
    e.stopPropagation();

    if (contextMenu && contextMenu.item && "id" in contextMenu.item && contextMenu.item.id === item.id) {
      setContextMenu(null);
      return;
    }

    const btnRect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = type === "file" ? 300 : 200;

    let x = btnRect.right - menuWidth;
    if (x < 8) x = btnRect.left;
    if (x + menuWidth > window.innerWidth - 8) {
      x = window.innerWidth - menuWidth - 8;
    }

    let y = btnRect.bottom + 4;
    if (y + menuHeight > window.innerHeight - 8) {
      y = Math.max(10, btnRect.top - menuHeight - 4);
    }

    setContextMenu({
      type,
      x,
      y,
      item,
    });
  };

  // Open menu on right-click
  const openMenuOnRowContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    type: "file" | "folder",
    item: Program | Folder
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 192;
    const menuHeight = type === "file" ? 300 : 200;

    let x = e.clientX;
    if (x + menuWidth > window.innerWidth - 8) {
      x = Math.max(8, e.clientX - menuWidth);
    }

    let y = e.clientY;
    if (y + menuHeight > window.innerHeight - 8) {
      y = Math.max(8, e.clientY - menuHeight);
    }

    setContextMenu({
      type,
      x,
      y,
      item,
    });
  };

  // -------------------------------------------------------------
  // Drag and Drop handlers: Fluid, flicker-free, with auto-expand
  // -------------------------------------------------------------
  const handleDragStart = (e: React.DragEvent, id: string, type: "file" | "folder", title?: string) => {
    e.stopPropagation();
    e.dataTransfer.setData("application/codesphere-id", id);
    e.dataTransfer.setData("application/codesphere-type", type);
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem({ id, type, title });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverFolderId(null);
    dragCountersRef.current = {};
    if (folderExpandTimerRef.current) clearTimeout(folderExpandTimerRef.current);
  };

  const handleDragEnterTarget = (e: React.DragEvent, folderId: string | "root") => {
    e.preventDefault();
    e.stopPropagation();
    dragCountersRef.current[folderId] = (dragCountersRef.current[folderId] || 0) + 1;
    setDragOverFolderId(folderId);

    // Auto-expand collapsed folders after 400ms hover
    if (folderId !== "root" && collapsedFolderIds.has(folderId)) {
      if (folderExpandTimerRef.current) clearTimeout(folderExpandTimerRef.current);
      folderExpandTimerRef.current = setTimeout(() => {
        onToggleFolder(folderId);
      }, 400);
    }
  };

  const handleDragOverTarget = (e: React.DragEvent, folderId: string | "root") => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeaveTarget = (e: React.DragEvent, folderId: string | "root") => {
    e.preventDefault();
    e.stopPropagation();
    dragCountersRef.current[folderId] = (dragCountersRef.current[folderId] || 0) - 1;
    if (dragCountersRef.current[folderId] <= 0) {
      dragCountersRef.current[folderId] = 0;
      if (dragOverFolderId === folderId) {
        setDragOverFolderId(null);
      }
    }
    if (folderExpandTimerRef.current) clearTimeout(folderExpandTimerRef.current);
  };

  const handleDropOnTarget = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    dragCountersRef.current = {};
    if (folderExpandTimerRef.current) clearTimeout(folderExpandTimerRef.current);

    const itemId = e.dataTransfer.getData("application/codesphere-id") || draggedItem?.id;
    const itemType = e.dataTransfer.getData("application/codesphere-type") || draggedItem?.type;

    if (!itemId) return;

    if (itemType === "folder") {
      if (itemId === targetFolderId) return; // Prevent cyclic self-drop
      if (onMoveFolder) {
        await onMoveFolder(itemId, targetFolderId);
      }
    } else {
      await onMoveProgram(itemId, targetFolderId);
    }

    setDraggedItem(null);
  };

  // Filter programs based on search query
  const matchesSearch = (title: string) => {
    if (!searchQuery.trim()) return true;
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // -------------------------------------------------------------
  // Recursive folder renderer
  // -------------------------------------------------------------
  const renderFolder = (folder: Folder, depth = 0, isPinnedView = false) => {
    const isCollapsed = collapsedFolderIds.has(folder.id);
    const isTarget = dragOverFolderId === folder.id;
    const isEditing = editingItemId === folder.id;
    const isDragging = draggedItem?.id === folder.id;
    const isPinned = pinnedItemIds.includes(folder.id);

    const folderFiles = programs.filter(
      (p) => p.folder_id === folder.id && matchesSearch(p.title)
    );
    const subFolders = folders.filter((f) => f.parent_id === folder.id);

    return (
      <div key={`folder-${folder.id}-${isPinnedView ? "pinned" : "tree"}`} className="select-none">
        {/* Folder row */}
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleDragStart(e, folder.id, "folder", folder.name)}
          onDragEnd={handleDragEnd}
          onContextMenu={(e) => openMenuOnRowContextMenu(e, "folder", folder)}
          onDragEnter={(e) => handleDragEnterTarget(e, folder.id)}
          onDragOver={(e) => handleDragOverTarget(e, folder.id)}
          onDragLeave={(e) => handleDragLeaveTarget(e, folder.id)}
          onDrop={(e) => handleDropOnTarget(e, folder.id)}
          onClick={() => onToggleFolder(folder.id)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`group flex items-center justify-between py-1 sm:py-1.5 pr-1.5 sm:pr-2 rounded-md sm:rounded-lg text-[11px] sm:text-xs cursor-pointer transition-all border ${
            isTarget
              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500 ring-2 ring-indigo-500/40 shadow-sm scale-[1.01]"
              : isDragging
              ? "opacity-40 border-dashed border-indigo-400"
              : isPinned && isPinnedView
              ? "border-l-2 border-l-indigo-500 bg-indigo-500/[0.06] text-foreground hover:bg-indigo-500/[0.12]"
              : "border-transparent text-foreground hover:bg-secondary/70"
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
            <ChevronRight
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 flex-shrink-0 ${
                !isCollapsed ? "rotate-90 text-primary" : ""
              }`}
            />
            {!isCollapsed ? (
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            ) : (
              <FolderIcon className="w-3.5 h-3.5 text-indigo-400/80 flex-shrink-0" />
            )}

            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFinishRename(folder.id, true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishRename(folder.id, true);
                  if (e.key === "Escape") setEditingItemId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-6 px-1.5 text-xs rounded bg-card border border-primary text-foreground focus:outline-none w-full"
              />
            ) : (
              <span className="font-medium truncate text-foreground/90">{folder.name}</span>
            )}

            {isPinned && (
              <span title="Pinned Folder">
                <Pin className="w-3 h-3 text-indigo-400 rotate-45 fill-indigo-400/30 flex-shrink-0" />
              </span>
            )}

            {isTarget && (
              <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 ml-auto shrink-0 animate-pulse">
                <FolderInput className="w-3 h-3" /> Drop inside
              </span>
            )}
          </div>

          {/* Quick hover actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePinItem(folder.id);
                useToastStore.getState().addToast(
                  isPinned ? `Unpinned "${folder.name}"` : `Pinned "${folder.name}" to top`,
                  "info"
                );
              }}
              className={`p-1 rounded hover:bg-muted-foreground/20 transition-all ${
                isPinned ? "text-indigo-400" : "text-muted-foreground hover:text-indigo-400"
              }`}
              title={isPinned ? "Unpin folder" : "Pin folder to top"}
            >
              <Pin className={`w-3 h-3 rotate-45 ${isPinned ? "fill-indigo-400/30" : ""}`} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateProgram(folder.id);
              }}
              className="p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
              title="New C File in this folder"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateFolder(folder.id);
              }}
              className="p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
              title="New Subfolder"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => openMenuForButton(e, "folder", folder)}
              className="p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
              title="Folder Options"
            >
              <MoreVertical className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Folder Children (Files & Subfolders) */}
        {!isCollapsed && !isPinnedView && (
          <div
            onDragEnter={(e) => handleDragEnterTarget(e, folder.id)}
            onDragOver={(e) => handleDragOverTarget(e, folder.id)}
            onDrop={(e) => handleDropOnTarget(e, folder.id)}
            className="space-y-0.5"
          >
            {subFolders.map((sub) => renderFolder(sub, depth + 1))}
            {folderFiles.map((file) => renderFile(file, depth + 1))}

            {folderFiles.length === 0 && subFolders.length === 0 && (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 18}px` }}
                className="py-1 text-[11px] text-muted-foreground/60 italic"
              >
                (Empty folder - drop files here)
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // Render individual file row
  // -------------------------------------------------------------
  const renderFile = (file: Program, depth = 0, isPinnedView = false) => {
    const isActive = activeProgram?.id === file.id;
    const isEditing = editingItemId === file.id;
    const isDragging = draggedItem?.id === file.id;
    const isPinned = pinnedItemIds.includes(file.id);

    return (
      <div
        key={`file-${file.id}-${isPinnedView ? "pinned" : "tree"}`}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, file.id, "file", file.title)}
        onDragEnd={handleDragEnd}
        // Dropping onto a file inside a folder drops into that folder!
        onDragEnter={(e) => handleDragEnterTarget(e, file.folder_id || "root")}
        onDragOver={(e) => handleDragOverTarget(e, file.folder_id || "root")}
        onDragLeave={(e) => handleDragLeaveTarget(e, file.folder_id || "root")}
        onDrop={(e) => handleDropOnTarget(e, file.folder_id || null)}
        onClick={() => onSelectProgram(file)}
        onContextMenu={(e) => openMenuOnRowContextMenu(e, "file", file)}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        className={`group flex items-center justify-between py-1 sm:py-1.5 pr-1.5 sm:pr-2 rounded-md sm:rounded-lg text-[11px] sm:text-xs cursor-pointer transition-all border ${
          isActive
            ? "bg-primary/15 text-primary border-primary/30 font-semibold shadow-xs"
            : isDragging
            ? "opacity-40 border-dashed border-primary"
            : isPinned && isPinnedView
            ? "border-l-2 border-l-indigo-500 bg-indigo-500/[0.06] text-foreground hover:bg-indigo-500/[0.12]"
            : "border-transparent text-foreground hover:bg-secondary/70"
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          <FileCode
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              isActive ? "text-primary" : "text-cyan-500/80 group-hover:text-cyan-400"
            }`}
          />

          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => handleFinishRename(file.id, false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFinishRename(file.id, false);
                if (e.key === "Escape") setEditingItemId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-6 px-1.5 text-xs rounded bg-card border border-primary text-foreground focus:outline-none w-full"
            />
          ) : (
            <span className="truncate">{file.title}</span>
          )}

          {isPinned && (
            <span title="Pinned File">
              <Pin className="w-3 h-3 text-indigo-400 rotate-45 fill-indigo-400/30 flex-shrink-0" />
            </span>
          )}
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {file.is_favorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
          {file.visibility === "public" && <Globe className="w-3 h-3 text-emerald-400" />}

          {/* Quick Pin Toggle on Hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePinItem(file.id);
              useToastStore.getState().addToast(
                isPinned ? `Unpinned "${file.title}"` : `Pinned "${file.title}" to top`,
                "info"
              );
            }}
            className={`p-1 rounded hover:bg-muted-foreground/20 transition-all ${
              isPinned ? "text-indigo-400" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-indigo-400"
            }`}
            title={isPinned ? "Unpin file" : "Pin file to top"}
          >
            <Pin className={`w-3 h-3 rotate-45 ${isPinned ? "fill-indigo-400/30" : ""}`} />
          </button>

          {/* Context menu button on hover */}
          <button
            type="button"
            onClick={(e) => openMenuForButton(e, "file", file)}
            className="p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            title="File Options"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // Top level folders & files
  const rootFolders = folders.filter((f) => !f.parent_id);
  const rootFiles = programs.filter(
    (p) => (!p.folder_id || !folders.some((f) => f.id === p.folder_id)) && matchesSearch(p.title)
  );

  // Pinned items
  const pinnedFolders = useMemo(() => folders.filter((f) => pinnedItemIds.includes(f.id)), [folders, pinnedItemIds]);
  const pinnedFiles = useMemo(
    () => programs.filter((p) => pinnedItemIds.includes(p.id) && matchesSearch(p.title)),
    [programs, pinnedItemIds, searchQuery]
  );
  const pinnedCount = pinnedFolders.length + pinnedFiles.length;

  return (
    <div
      ref={treeContainerRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => handleDropOnTarget(e, null)}
      onContextMenu={(e) => {
        e.preventDefault();
        const menuWidth = 192;
        let x = e.clientX;
        if (x + menuWidth > window.innerWidth - 8) {
          x = Math.max(8, e.clientX - menuWidth);
        }
        let y = e.clientY;
        if (y + 180 > window.innerHeight - 8) {
          y = Math.max(8, e.clientY - 180);
        }
        setContextMenu({
          type: "root",
          x,
          y,
          item: null,
        });
      }}
      className="flex-1 overflow-y-auto px-1 sm:px-1.5 py-1.5 sm:py-2 space-y-0.5 select-none relative scrollbar-thin"
    >
      {/* Root Drop Target Banner when Dragging */}
      {draggedItem && (
        <div
          onDragEnter={(e) => handleDragEnterTarget(e, "root")}
          onDragOver={(e) => handleDragOverTarget(e, "root")}
          onDragLeave={(e) => handleDragLeaveTarget(e, "root")}
          onDrop={(e) => handleDropOnTarget(e, null)}
          className={`p-2 rounded-xl border-2 border-dashed text-center text-xs font-semibold transition-all mb-2 cursor-pointer ${
            dragOverFolderId === "root"
              ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 scale-[1.01] shadow-md ring-2 ring-indigo-500/30"
              : "border-border/80 text-muted-foreground hover:border-indigo-500/50 hover:bg-indigo-500/[0.04]"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5" />
            Drop here to move to Root (Unfiled)
          </span>
        </div>
      )}

      {/* PINNED QUICK ACCESS SECTION */}
      {pinnedCount > 0 && !searchQuery.trim() && (
        <div className="mb-2.5 pb-2 border-b border-border/60">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Pin className="w-3 h-3 rotate-45 text-indigo-400 fill-indigo-400/30" />
              Pinned Items
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-mono text-muted-foreground">
              {pinnedCount}
            </span>
          </div>
          <div className="space-y-0.5 mt-0.5">
            {pinnedFolders.map((f) => renderFolder(f, 0, true))}
            {pinnedFiles.map((file) => renderFile(file, 0, true))}
          </div>
        </div>
      )}

      {/* Render Main Root Folders Tree */}
      {rootFolders.map((f) => renderFolder(f, 0))}

      {/* Render Main Root Files */}
      {rootFiles.map((f) => renderFile(f, 0))}

      {/* Empty State when no files match */}
      {programs.length === 0 && folders.length === 0 && (
        <div className="py-12 text-center text-xs text-muted-foreground px-4">
          <FileCode className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
          <p className="font-semibold text-foreground">No files yet</p>
          <p className="text-[11px] mt-1 text-muted-foreground">
            Create a new C file or folder to start organizing your programs.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => onCreateProgram(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90"
            >
              + New File
            </button>
            <button
              type="button"
              onClick={() => onCreateFolder(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80"
            >
              + New Folder
            </button>
          </div>
        </div>
      )}

      {/* CONTEXT MENU POPUP (Right-Click & Three-Dot Menu) */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-[9999] w-48 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 shadow-2xl p-1.5 text-xs font-medium space-y-0.5 animate-in fade-in-50 zoom-in-95 backdrop-blur-2xl"
        >
          {/* FILE ACTIONS */}
          {contextMenu.type === "file" && contextMenu.item && (
            <>
              {/* Pin File Toggle */}
              <button
                type="button"
                onClick={() => {
                  const p = contextMenu.item as Program;
                  setContextMenu(null);
                  togglePinItem(p.id);
                  const isPinned = pinnedItemIds.includes(p.id);
                  useToastStore.getState().addToast(
                    isPinned ? `Unpinned "${p.title}"` : `Pinned "${p.title}" to top`,
                    "info"
                  );
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5 rotate-45 text-indigo-400" />
                <span>{pinnedItemIds.includes((contextMenu.item as Program).id) ? "Unpin File" : "Pin File to Top"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const p = contextMenu.item as Program;
                  handleStartRename(p.id, p.title);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span>Rename (F2)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  onDuplicateProgram(contextMenu.item as Program);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <CopyPlus className="w-3.5 h-3.5 text-primary" />
                <span>Duplicate File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const p = contextMenu.item as Program;
                  setContextMenu(null);
                  onToggleFavorite(p);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>{(contextMenu.item as Program).is_favorite ? "Unmark Favorite" : "Mark as Favorite"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const p = contextMenu.item as Program;
                  setContextMenu(null);
                  onToggleVisibility(p);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                {(contextMenu.item as Program).visibility === "private" ? (
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>{(contextMenu.item as Program).visibility === "private" ? "Make Public" : "Make Private"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const p = contextMenu.item as Program;
                  setContextMenu(null);
                  navigator.clipboard.writeText(p.title);
                  useToastStore.getState().addToast(`Copied "${p.title}" to clipboard!`, "success");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
                <span>Copy File Name</span>
              </button>

              {/* Move to Root option if currently in a folder */}
              {(contextMenu.item as Program).folder_id && (
                <button
                  type="button"
                  onClick={() => {
                    const p = contextMenu.item as Program;
                    setContextMenu(null);
                    onMoveProgram(p.id, null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
                >
                  <CornerDownRight className="w-3.5 h-3.5 text-primary" />
                  <span>Move to Root Directory</span>
                </button>
              )}

              <div className="h-px bg-border my-1" />

              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  onDeleteProgram(contextMenu.item as Program);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete File</span>
              </button>
            </>
          )}

          {/* FOLDER ACTIONS */}
          {contextMenu.type === "folder" && contextMenu.item && (
            <>
              {/* Pin Folder Toggle */}
              <button
                type="button"
                onClick={() => {
                  const f = contextMenu.item as Folder;
                  setContextMenu(null);
                  togglePinItem(f.id);
                  const isPinned = pinnedItemIds.includes(f.id);
                  useToastStore.getState().addToast(
                    isPinned ? `Unpinned "${f.name}"` : `Pinned "${f.name}" to top`,
                    "info"
                  );
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5 rotate-45 text-indigo-400" />
                <span>{pinnedItemIds.includes((contextMenu.item as Folder).id) ? "Unpin Folder" : "Pin Folder to Top"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const f = contextMenu.item as Folder;
                  setContextMenu(null);
                  onCreateProgram(f.id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>New File Inside</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const f = contextMenu.item as Folder;
                  setContextMenu(null);
                  onCreateFolder(f.id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-primary" />
                <span>New Subfolder</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const f = contextMenu.item as Folder;
                  handleStartRename(f.id, f.name);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span>Rename Folder</span>
              </button>

              {/* Move folder to Root if inside another folder */}
              {(contextMenu.item as Folder).parent_id && onMoveFolder && (
                <button
                  type="button"
                  onClick={() => {
                    const f = contextMenu.item as Folder;
                    setContextMenu(null);
                    onMoveFolder(f.id, null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
                >
                  <CornerDownRight className="w-3.5 h-3.5 text-primary" />
                  <span>Move to Root Directory</span>
                </button>
              )}

              <div className="h-px bg-border my-1" />

              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  onDeleteFolder(contextMenu.item as Folder);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Folder</span>
              </button>
            </>
          )}

          {/* ROOT AREA ACTIONS */}
          {contextMenu.type === "root" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  onCreateProgram(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>New File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  onCreateFolder(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-secondary cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-primary" />
                <span>New Folder</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

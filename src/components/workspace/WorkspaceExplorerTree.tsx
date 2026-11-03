"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Program, Folder } from "@/lib/store/useWorkspaceStore";
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
  onDuplicateProgram,
  onToggleFavorite,
  onToggleVisibility,
  onToggleFolder,
}: WorkspaceExplorerTreeProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | "root">(null);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const treeContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Open menu on three-dot button click: toggles close if reclicking the same item
  const openMenuForButton = (
    e: React.MouseEvent<HTMLButtonElement>,
    type: "file" | "folder",
    item: Program | Folder
  ) => {
    e.stopPropagation();

    // Toggle close if already open on this exact item
    if (contextMenu && contextMenu.item && "id" in contextMenu.item && contextMenu.item.id === item.id) {
      setContextMenu(null);
      return;
    }

    const btnRect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 192; // w-48 is 12rem = 192px
    const menuHeight = type === "file" ? 270 : 170;

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

  // Open menu on right-click: appears EXACTLY at the mouse position where right-clicked!
  const openMenuOnRowContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    type: "file" | "folder",
    item: Program | Folder
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 192;
    const menuHeight = type === "file" ? 270 : 170;

    // Exact cursor position with viewport boundary guard
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

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData("application/codesphere-file", fileId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedFileId(fileId);
  };

  const handleDragEnd = () => {
    setDraggedFileId(null);
    setDragOverFolderId(null);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(folderId);
  };

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    const fileId = e.dataTransfer.getData("application/codesphere-file") || draggedFileId;
    if (fileId) {
      await onMoveProgram(fileId, targetFolderId);
    }
    setDraggedFileId(null);
  };

  // Filter programs based on search query
  const matchesSearch = (title: string) => {
    if (!searchQuery.trim()) return true;
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Recursive folder renderer
  const renderFolder = (folder: Folder, depth = 0) => {
    const isCollapsed = collapsedFolderIds.has(folder.id);
    const isTarget = dragOverFolderId === folder.id;
    const isEditing = editingItemId === folder.id;

    // Direct files in this folder
    const folderFiles = programs.filter(
      (p) => p.folder_id === folder.id && matchesSearch(p.title)
    );

    // Subfolders of this folder
    const subFolders = folders.filter((f) => f.parent_id === folder.id);

    return (
      <div key={folder.id} className="select-none">
        {/* Folder row */}
        <div
          onContextMenu={(e) => openMenuOnRowContextMenu(e, "folder", folder)}
          onDragOver={(e) => handleFolderDragOver(e, folder.id)}
          onDragLeave={() => {
            if (dragOverFolderId === folder.id) setDragOverFolderId(null);
          }}
          onDrop={(e) => handleFolderDrop(e, folder.id)}
          onClick={() => onToggleFolder(folder.id)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`group flex items-center justify-between py-1 sm:py-1.5 pr-1.5 sm:pr-2 rounded-md sm:rounded-lg text-[11px] sm:text-xs cursor-pointer transition-all border ${
            isTarget
              ? "bg-primary/20 border-primary shadow-xs"
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
          </div>

          {/* Quick hover actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity">
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
        {!isCollapsed && (
          <div className="space-y-0.5">
            {/* Render nested subfolders */}
            {subFolders.map((sub) => renderFolder(sub, depth + 1))}

            {/* Render files in this folder */}
            {folderFiles.map((file) => renderFile(file, depth + 1))}

            {/* Empty state for folder */}
            {folderFiles.length === 0 && subFolders.length === 0 && (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 18}px` }}
                className="py-1 text-[11px] text-muted-foreground/60 italic"
              >
                (Empty folder)
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render individual file row
  const renderFile = (file: Program, depth = 0) => {
    const isActive = activeProgram?.id === file.id;
    const isEditing = editingItemId === file.id;

    return (
      <div
        key={file.id}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, file.id)}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectProgram(file)}
        onContextMenu={(e) => openMenuOnRowContextMenu(e, "file", file)}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        className={`group flex items-center justify-between py-1 sm:py-1.5 pr-1.5 sm:pr-2 rounded-md sm:rounded-lg text-[11px] sm:text-xs cursor-pointer transition-all border ${
          isActive
            ? "bg-primary/15 text-primary border-primary/30 font-semibold shadow-xs"
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
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {file.is_favorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
          {file.visibility === "public" && <Globe className="w-3 h-3 text-emerald-400" />}

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

  // Top level folders (parent_id === null or undefined)
  const rootFolders = folders.filter((f) => !f.parent_id);

  // Top level files (folder_id === null or undefined)
  const rootFiles = programs.filter(
    (p) => (!p.folder_id || !folders.some((f) => f.id === p.folder_id)) && matchesSearch(p.title)
  );

  return (
    <div
      ref={treeContainerRef}
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
      className="flex-1 overflow-y-auto px-1 sm:px-1.5 py-1.5 sm:py-2 space-y-0.5 select-none relative"
    >
      {/* Root Drop Target Banner when Dragging */}
      {draggedFileId && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverFolderId("root");
          }}
          onDragLeave={() => {
            if (dragOverFolderId === "root") setDragOverFolderId(null);
          }}
          onDrop={(e) => handleFolderDrop(e, null)}
          className={`p-2.5 rounded-xl border-2 border-dashed text-center text-xs font-semibold transition-all mb-2 cursor-pointer ${
            dragOverFolderId === "root"
              ? "border-primary bg-primary/20 text-primary scale-102"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          <span>Drop here to move to Root (Unfiled)</span>
        </div>
      )}

      {/* Render Root Folders Tree */}
      {rootFolders.map((f) => renderFolder(f, 0))}

      {/* Render Root Files */}
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

      {/* CONTEXT MENU POPUP (Right-Click & Three-Dot Menu) - Liquid Glass within Sidebar Boundaries */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-[9999] w-48 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 shadow-2xl p-1.5 text-xs font-medium space-y-0.5 animate-in fade-in-50 zoom-in-95 backdrop-blur-2xl"
        >
          {/* FILE ACTIONS */}
          {contextMenu.type === "file" && contextMenu.item && (
            <>
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

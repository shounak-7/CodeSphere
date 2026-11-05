"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Program {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  source_code: string;
  language: string;
  category: string;
  tags: string[];
  folder_id?: string | null;
  is_favorite: boolean;
  visibility: "private" | "public";
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  owner_id: string;
  name: string;
  parent_id?: string | null;
  created_at: string;
}

interface WorkspaceState {
  programs: Program[];
  folders: Folder[];
  activeProgram: Program | null;
  activeCode: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  searchQuery: string;
  selectedCategory: string;
  selectedFolderId: string | null;
  pinnedItemIds: string[];

  setPrograms: (programs: Program[]) => void;
  setFolders: (folders: Folder[]) => void;
  setActiveProgram: (program: Program | null) => void;
  setActiveCode: (code: string) => void;
  setIsDirty: (isDirty: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedFolderId: (folderId: string | null) => void;
  togglePinItem: (id: string) => void;
  isItemPinned: (id: string) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      programs: [],
      folders: [],
      activeProgram: null,
      activeCode: "",
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
      searchQuery: "",
      selectedCategory: "All",
      selectedFolderId: null,
      pinnedItemIds: [],

      setPrograms: (programs) => set({ programs }),
      setFolders: (folders) => set({ folders }),
      setActiveProgram: (program) =>
        set({
          activeProgram: program,
          activeCode: program ? program.source_code : "",
          isDirty: false,
        }),
      setActiveCode: (code) =>
        set((state) => {
          if (!state.activeProgram) return { activeCode: code };
          return {
            activeCode: code,
            activeProgram: {
              ...state.activeProgram,
              source_code: code,
            },
            isDirty: false,
            lastSavedAt: new Date(),
          };
        }),
      setIsDirty: (isDirty) => set({ isDirty }),
      setIsSaving: (isSaving) => set({ isSaving }),
      setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSelectedFolderId: (selectedFolderId) => set({ selectedFolderId }),
      togglePinItem: (id: string) =>
        set((state) => {
          const current = state.pinnedItemIds || [];
          const exists = current.includes(id);
          const next = exists ? current.filter((item) => item !== id) : [...current, id];
          return { pinnedItemIds: next };
        }),
      isItemPinned: (id: string) => Boolean(get().pinnedItemIds?.includes(id)),
    }),
    {
      name: "codesphere_workspace_cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        programs: state.programs,
        folders: state.folders,
        activeProgram: state.activeProgram,
        activeCode: state.activeCode,
        pinnedItemIds: state.pinnedItemIds,
      }),
    }
  )
);

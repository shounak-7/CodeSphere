"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "light" | "dark" | "system";
export type EditorTheme = "vs-dark" | "light" | "hc-black" | "system";

interface ThemeState {
  theme: AppTheme;
  editorTheme: EditorTheme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: AppTheme) => void;
  setEditorTheme: (theme: EditorTheme) => void;
  setResolvedTheme: (resolved: "light" | "dark") => void;
}

function resolveTheme(theme: AppTheme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  }
  return theme;
}

function applyThemeToDOM(resolved: "light" | "dark") {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    }

    // Also persist to cookie for server-side awareness if needed
    try {
      document.cookie = `codesphere_theme=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      editorTheme: "system",
      resolvedTheme: "dark",
      setTheme: (theme: AppTheme) => {
        const resolved = resolveTheme(theme);
        applyThemeToDOM(resolved);

        set((state) => ({
          theme,
          resolvedTheme: resolved,
          editorTheme:
            state.editorTheme === "hc-black"
              ? "hc-black"
              : resolved === "dark"
              ? "vs-dark"
              : "light",
        }));
      },
      setEditorTheme: (editorTheme: EditorTheme) => {
        set({ editorTheme });
      },
      setResolvedTheme: (resolvedTheme: "light" | "dark") => {
        applyThemeToDOM(resolvedTheme);
        set({ resolvedTheme });
      },
    }),
    {
      name: "codesphere-theme-preferences",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme);
          applyThemeToDOM(resolved);
          state.resolvedTheme = resolved;
        }
      },
    }
  )
);

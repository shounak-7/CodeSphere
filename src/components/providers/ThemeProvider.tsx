"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/lib/store/useThemeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);

    // Re-verify theme on client mount based on active store state
    const currentTheme = useThemeStore.getState().theme;
    setTheme(currentTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (useThemeStore.getState().theme === "system") {
        setTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setTheme]);

  // Avoid visual mismatch during hydration
  return <>{children}</>;
}

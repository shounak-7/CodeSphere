"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { Loader2 } from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-card text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="ml-2 text-sm font-mono">Loading Monaco Editor...</span>
    </div>
  ),
});

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  fontSize?: number;
  height?: string;
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded";
}

export function CodeEditor({
  code,
  onChange,
  language = "c",
  readOnly = false,
  fontSize = 14,
  height = "100%",
  wordWrap = "off",
}: CodeEditorProps) {
  const { editorTheme, resolvedTheme } = useThemeStore();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return resolvedTheme !== "light";
  });

  // Track viewport width for responsive mobile compact editor mode
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track root document theme class changes reliably
  useEffect(() => {
    const checkDark = () => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDarkMode(dark);
    };

    checkDark();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "class") {
          checkDark();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [resolvedTheme]);

  // Determine Monaco editor theme: "vs" for light mode, "vs-dark" for dark mode
  const activeTheme =
    editorTheme === "hc-black"
      ? "hc-black"
      : isDarkMode
      ? "vs-dark"
      : "vs";

  const effectiveFontSize = isMobile ? Math.min(fontSize, 12) : fontSize;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  // Dynamically update Monaco wordWrap configuration instantly when toggled
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        wordWrap: wordWrap || "off",
        wrappingIndent: "indent",
      });
    }
  }, [wordWrap]);

  return (
    <div className="w-full h-full overflow-hidden">
      <Editor
        height={height}
        language={language}
        theme={activeTheme}
        value={code}
        onChange={onChange}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onMount={(editor: any) => {
          editorRef.current = editor;
        }}
        options={{
          readOnly,
          fontSize: effectiveFontSize,
          tabSize: 2,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: wordWrap || "off",
          wrappingIndent: "indent",
          fontFamily: "var(--font-mono), 'SF Mono', Menlo, Monaco, 'Courier New', monospace",
          fontLigatures: true,
          formatOnPaste: true,
          formatOnType: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          padding: isMobile ? { top: 6, bottom: 6 } : { top: 12, bottom: 12 },
          // VS Code style function & block collapsing / code folding
          folding: true,
          foldingStrategy: "auto",
          showFoldingControls: "always",
          foldingHighlight: true,
          unfoldOnClickAfterEndOfLine: true,
          matchBrackets: "always",
          bracketPairColorization: { enabled: true },
          renderLineHighlight: "all",
          lineNumbersMinChars: isMobile ? 2 : 3,
        }}
      />
    </div>
  );
}

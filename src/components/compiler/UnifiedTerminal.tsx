"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Terminal as TerminalIcon,
  FileText,
  AlertTriangle,
  Play,
  Square,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  CornerDownLeft,
  Keyboard,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TerminalEntry, CompilerProblem } from "@/lib/compiler/useCompilerRunner";

interface UnifiedTerminalProps {
  stdout: string;
  stderr: string;
  terminalEntries?: TerminalEntry[];
  problems?: CompilerProblem[];
  isRunning: boolean;
  status: "idle" | "running" | "success" | "error";
  exitCode?: number | null;
  durationMs: number | null;
  height?: number | string;
  onHeightChange?: (newHeight: number) => void;
  onClear: () => void;
  onRun?: () => void;
  onSendInput?: (input: string) => Promise<boolean> | void;
  onSendEof?: () => Promise<boolean> | void;
  onKill?: () => void;
  batchStdin?: string;
  onBatchStdinChange?: (val: string) => void;
}

export function UnifiedTerminal({
  stdout,
  stderr,
  terminalEntries = [],
  problems = [],
  isRunning,
  status,
  exitCode = null,
  durationMs,
  height = 260,
  onHeightChange,
  onClear,
  onRun,
  onSendInput,
  onSendEof,
  onKill,
  batchStdin = "",
  onBatchStdinChange,
}: UnifiedTerminalProps) {
  const [activeTab, setActiveTab] = useState<"terminal" | "output" | "problems" | "stdin">("terminal");
  const [currentLine, setCurrentLine] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const terminalScrollRef = useRef<HTMLDivElement | null>(null);
  const startDragYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(typeof height === "number" ? height : 260);

  // Auto-scroll terminal stream directly to bottom without disruptive smooth-scroll animations
  useEffect(() => {
    if (!isCollapsed && (activeTab === "terminal" || activeTab === "output") && terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [stdout, stderr, terminalEntries, isCollapsed, activeTab]);

  // Keep interactive scanf input focused when running
  useEffect(() => {
    if (isRunning && activeTab === "terminal") {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isRunning, activeTab]);

  // Switch to Problems tab automatically if compilation error occurs
  useEffect(() => {
    if (status === "error" && problems.length > 0) {
      setActiveTab("problems");
    }
  }, [status, problems.length]);

  // Drag resizer handler
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startDragYRef.current = e.clientY;
    startHeightRef.current = typeof height === "number" ? height : 260;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startDragYRef.current - moveEvent.clientY;
      const nextHeight = Math.min(Math.max(130, startHeightRef.current + deltaY), window.innerHeight - 140);
      onHeightChange?.(nextHeight);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleSendInput = async () => {
    const val = currentLine;
    setCurrentLine("");
    if (onSendInput) {
      await onSendInput(val);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendInput();
    } else if (e.key === "d" && e.ctrlKey) {
      e.preventDefault();
      onSendEof?.();
    } else if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onKill?.();
    }
  };

  const handleCopy = () => {
    let contentToCopy = "";
    if (activeTab === "terminal") {
      contentToCopy = terminalEntries.map((e) => e.text).join("\n") || stdout;
    } else if (activeTab === "output") {
      contentToCopy = stdout;
    } else if (activeTab === "problems") {
      contentToCopy = problems.map((p) => `${p.file}:${p.line}:${p.column}: ${p.severity}: ${p.message}`).join("\n") || stderr;
    } else {
      contentToCopy = batchStdin;
    }

    if (contentToCopy.trim()) {
      navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If collapsed: render sleek 36px bottom status pill bar
  if (isCollapsed) {
    return (
      <div className="h-9 px-3 border-t border-slate-200/90 dark:border-white/[0.08] bg-[#f1f5f9] dark:bg-[#0b1120] flex items-center justify-between text-xs select-none transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5 text-primary" />
            <span>Console</span>
          </button>

          {/* Quick status pill */}
          {isRunning ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
              <Clock className="w-3 h-3" /> Running GCC...
            </span>
          ) : status === "success" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> Exited {exitCode ?? 0} ({durationMs ?? 0}ms)
            </span>
          ) : status === "error" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
              <XCircle className="w-3 h-3" /> Error ({problems.length} issues)
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">GCC 11 Ready</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            title="Expand Console"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const effectiveHeight = isMaximized ? "100%" : typeof height === "number" ? `${height}px` : height;

  return (
    <div
      style={{ height: effectiveHeight }}
      className={`relative flex flex-col bg-[#f8fafc] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-mono text-xs border-t border-slate-200/90 dark:border-white/[0.08] overflow-hidden select-text transition-[height] duration-75 shadow-xs ${
        isMaximized ? "absolute inset-0 z-30 h-full" : ""
      }`}
    >
      {/* Draggable Top Resize Handle */}
      {!isMaximized && typeof height === "number" && (
        <div
          onMouseDown={handleMouseDownResize}
          onDoubleClick={() => onHeightChange?.(height > 350 ? 240 : 420)}
          className={`h-1.5 w-full -mt-0.5 cursor-row-resize absolute top-0 left-0 right-0 z-10 transition-colors ${
            isDragging ? "bg-primary" : "hover:bg-primary/50 bg-transparent"
          }`}
          title="Drag to resize console (double-click to expand)"
        />
      )}

      {/* Console Header Bar */}
      <div className="h-8 sm:h-10 px-2 sm:px-3 border-b border-slate-200/90 dark:border-white/[0.08] bg-[#f1f5f9] dark:bg-[#0b1120] flex items-center justify-between flex-shrink-0 cursor-default select-none transition-colors">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none min-w-0 pr-2">
          {/* Tab: Interactive Terminal */}
          <button
            type="button"
            onClick={() => setActiveTab("terminal")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === "terminal"
                ? "bg-white dark:bg-white/[0.08] text-indigo-600 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]"
            }`}
          >
            <TerminalIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>Terminal</span>
            {isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Tab: Pure Output */}
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === "output"
                ? "bg-white dark:bg-white/[0.08] text-indigo-600 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]"
            }`}
          >
            <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>Output</span>
          </button>

          {/* Tab: Problems / Diagnostics */}
          <button
            type="button"
            onClick={() => setActiveTab("problems")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === "problems"
                ? "bg-white dark:bg-white/[0.08] text-indigo-600 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]"
            }`}
          >
            <AlertTriangle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>Problems</span>
            {problems.length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30">
                {problems.length}
              </span>
            ) : stderr ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                !
              </span>
            ) : null}
          </button>

          {/* Tab: Pre-set STDIN Drawer */}
          {onBatchStdinChange && (
            <button
              type="button"
              onClick={() => setActiveTab("stdin")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                activeTab === "stdin"
                  ? "bg-white dark:bg-white/[0.08] text-indigo-600 dark:text-white border border-slate-200/90 dark:border-white/10 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]"
              }`}
            >
              <Keyboard className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span className="hidden sm:inline">STDIN Testcases</span>
              <span className="sm:hidden">STDIN</span>
              {batchStdin.trim() && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Center: Execution Status */}
        <div className="hidden md:flex items-center gap-2">
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
              <Clock className="w-3 h-3" />
              <span>Program running (interactive STDIN active)...</span>
            </span>
          ) : status === "success" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Exited 0 in {durationMs ?? 0}ms</span>
            </span>
          ) : status === "error" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
              <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span>Process failed {exitCode !== null ? `(code ${exitCode})` : ""}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">GCC 11 (C11) Ready</span>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Run Again / Execute */}
          {onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer mr-0.5 sm:mr-1"
              title="Run Code (Ctrl+Enter)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">Run Again</span>
            </button>
          )}

          {/* Stop / Terminate when running */}
          {isRunning && onKill && (
            <button
              type="button"
              onClick={onKill}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-sm cursor-pointer animate-pulse mr-0.5 sm:mr-1"
              title="Stop process (Kill)"
            >
              <Square className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Copy Output */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 sm:p-1.5 rounded-md sm:rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Copy Console Output"
            aria-label="Copy Output"
          >
            {copied ? <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500" /> : <Copy className="w-3 sm:w-3.5 h-3 sm:h-3.5" />}
          </button>

          {/* Clear Console */}
          <button
            type="button"
            onClick={onClear}
            className="p-1 sm:p-1.5 rounded-md sm:rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Clear Console"
            aria-label="Clear Console"
          >
            <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </button>

          {/* Maximize / Restore Toggle */}
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 sm:p-1.5 rounded-md sm:rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={isMaximized ? "Restore Height" : "Maximize Console"}
          >
            {isMaximized ? <Minimize2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> : <Maximize2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />}
          </button>

          {/* Minimize / Collapse */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1 sm:p-1.5 rounded-md sm:rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimize Console"
          >
            <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Console Tab Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] dark:bg-[#070b14] transition-colors overflow-hidden">
        {/* TAB 1: INTERACTIVE TERMINAL */}
        {activeTab === "terminal" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Output Viewport */}
            <div
              ref={terminalScrollRef}
              onClick={() => inputRef.current?.focus()}
              className="flex-1 p-2.5 sm:p-4 overflow-y-auto cursor-text font-mono text-[11px] sm:text-xs leading-relaxed space-y-1 sm:space-y-1.5"
            >
              {/* If nothing run yet */}
              {terminalEntries.length === 0 && !stdout && !stderr && status === "idle" && (
                <div className="py-6 sm:py-8 text-center text-slate-500">
                  <TerminalIcon className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-2 text-primary/40" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Interactive Execution Console</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Click &ldquo;Run GCC&rdquo; or press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-white/10 font-mono">Ctrl+Enter</kbd> to compile and execute with interactive STDIN.
                  </p>
                </div>
              )}

              {/* Terminal stream entries */}
              {terminalEntries.length > 0 ? (
                terminalEntries.map((entry) => {
                  if (entry.type === "stdout") {
                    return (
                      <span key={entry.id} className="whitespace-pre-wrap text-slate-900 dark:text-slate-100 font-mono">
                        {entry.text}
                      </span>
                    );
                  }
                  if (entry.type === "input") {
                    return (
                      <span
                        key={entry.id}
                        className="text-emerald-600 dark:text-cyan-300 font-bold font-mono whitespace-pre-wrap"
                      >
                        {entry.text}
                        {"\n"}
                      </span>
                    );
                  }
                  if (entry.type === "stderr") {
                    return (
                      <div key={entry.id} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 whitespace-pre-wrap my-1 font-mono text-[11px]">
                        {entry.text}
                      </div>
                    );
                  }
                  if (entry.type === "exit") {
                    return (
                      <div
                        key={entry.id}
                        className={`text-[11px] pt-2 mt-2 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between font-mono ${
                          entry.code === 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-red-600 dark:text-red-400 font-semibold"
                        }`}
                      >
                        <span>
                          {entry.code === 0 ? "✓ Program exited successfully (code 0)" : `✕ Program exited with error code ${entry.code}`}
                        </span>
                        {entry.durationMs !== undefined && (
                          <span className="text-slate-500 text-[10px]">
                            Finished in {entry.durationMs}ms
                          </span>
                        )}
                      </div>
                    );
                  }
                  if (entry.type === "system") {
                    return (
                      <div key={entry.id} className="text-slate-500 dark:text-slate-400 italic text-[11px] my-1 font-mono">
                        {entry.text}
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                /* Fallback if entries empty but raw stdout/stderr present */
                <>
                  {stdout && <div className="whitespace-pre-wrap text-slate-900 dark:text-slate-100">{stdout}</div>}
                  {stderr && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 whitespace-pre-wrap">
                      {stderr}
                    </div>
                  )}
                </>
              )}

              {/* Real-time VS Code-style inline typing prompt & cursor when running */}
              {isRunning && (
                <span className="inline-flex items-center text-emerald-600 dark:text-cyan-300 font-bold font-mono">
                  <span>{currentLine}</span>
                  <span className="w-2 h-3.5 sm:h-4 bg-emerald-500 dark:bg-cyan-400 animate-pulse ml-0.5 inline-block align-middle" />
                </span>
              )}
            </div>

            {/* Pinned Fixed Bottom Input Dock (Always visible, never scrolls off-screen) */}
            <div className="flex-shrink-0 p-2 sm:p-2.5 border-t border-slate-200/90 dark:border-white/[0.08] bg-[#f1f5f9] dark:bg-[#0b1120] flex items-center gap-1.5 sm:gap-2 shadow-xs transition-colors">
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-indigo-50 dark:bg-cyan-950/40 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-800/40 text-[10px] sm:text-[11px] font-bold font-mono shrink-0 select-none">
                <span>➜</span>
                <span>{isRunning ? "scanf >" : "stdin >"}</span>
              </span>

              <input
                ref={inputRef}
                type="text"
                value={currentLine}
                onChange={(e) => setCurrentLine(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  isRunning
                    ? "Enter program input & press Enter..."
                    : "Terminal ready. Press Run or Ctrl+Enter to execute..."
                }
                className="flex-1 bg-white dark:bg-[#070b14] border border-slate-300/80 dark:border-white/10 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 text-slate-900 dark:text-slate-100 text-[11px] sm:text-xs font-mono focus:outline-none focus:ring-1.5 focus:ring-primary/40 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
              />

              {/* Action Buttons for STDIN */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {isRunning && onKill && (
                  <button
                    type="button"
                    onClick={onKill}
                    className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer animate-pulse transition-all active:scale-95"
                    title="Stop process immediately (Ctrl+C)"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop</span>
                  </button>
                )}

                {isRunning && onSendEof && (
                  <button
                    type="button"
                    onClick={() => onSendEof()}
                    className="px-1.5 sm:px-2 py-1 rounded-lg sm:rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-[9px] sm:text-[10px] font-mono cursor-pointer border border-slate-300/80 dark:border-white/10 transition-colors"
                    title="Send EOF (Ctrl+D) to end input loops"
                  >
                    EOF
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSendInput}
                  disabled={!isRunning && !onRun}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer ${
                    isRunning
                      ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                      : "bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{isRunning ? "Send" : "Run"}</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PURE STDOUT OUTPUT */}
        {activeTab === "output" && (
          <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed select-text">
            {stdout ? (
              <pre className="whitespace-pre-wrap text-slate-900 dark:text-slate-100 font-mono">{stdout}</pre>
            ) : (
              <div className="py-8 sm:py-12 text-center text-slate-500">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 opacity-40 text-primary" />
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Pure Standard Output</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Once your C program executes, its raw `stdout` will appear here without input prompt markers.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROBLEMS & DIAGNOSTICS */}
        {activeTab === "problems" && (
          <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto space-y-2 sm:space-y-3 font-mono text-[11px] sm:text-xs">
            {problems.length > 0 ? (
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400 font-bold pb-2 border-b border-slate-200 dark:border-white/[0.08]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{problems.length} Problem{problems.length > 1 ? "s" : ""} Found:</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">GCC C11 Diagnostics</span>
                </div>

                {problems.map((prob) => (
                  <div
                    key={prob.id}
                    className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/40 text-red-800 dark:text-red-200 space-y-1.5 sm:space-y-2"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                          prob.severity === "error"
                            ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {prob.severity}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] sm:text-xs">
                        {prob.file} [Line {prob.line}, Col {prob.column}]
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 font-sans text-xs">{prob.message}</p>

                    {prob.snippet && (
                      <pre className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white dark:bg-black/40 border border-red-200 dark:border-red-950 text-red-700 dark:text-red-300 font-mono text-[10px] sm:text-[11px] overflow-x-auto whitespace-pre">
                        {prob.snippet}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : stderr ? (
              /* Raw stderr fallback */
              <div className="space-y-3">
                <div className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Compiler Diagnostic Output:</span>
                </div>
                <pre className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/40 text-red-800 dark:text-red-200 whitespace-pre-wrap font-mono text-[10px] sm:text-[11px]">
                  {stderr}
                </pre>

                {/* If timed out waiting for input or infinite loop, provide direct STDIN CTA */}
                {stderr.includes("waiting for unprovided input") && onBatchStdinChange && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Keyboard className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Does this program use <code>scanf()</code> or require user input? Provide testcase inputs in the STDIN tab.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("stdin")}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shrink-0 transition-colors cursor-pointer"
                    >
                      Open STDIN Tab
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 sm:py-12 text-center text-slate-500">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 text-emerald-500" />
                <p className="font-medium text-slate-700 dark:text-slate-300 text-xs sm:text-sm">No Problems Detected</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  GCC compiled your C source code cleanly without any errors or warnings.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRE-SET STDIN TESTCASES */}
        {activeTab === "stdin" && onBatchStdinChange && (
          <div className="flex-1 p-2.5 sm:p-4 flex flex-col justify-between overflow-y-auto space-y-2 sm:space-y-3 font-mono text-[11px] sm:text-xs">
            <div className="space-y-1.5 sm:space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  <span className="font-bold">Pre-configured STDIN Testcase:</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:inline">
                  Ideal for arrays, multiline testcases, or competitive programming
                </span>
              </div>

              <textarea
                value={batchStdin}
                onChange={(e) => onBatchStdinChange(e.target.value)}
                placeholder={"Enter or paste test case input here...\nExample:\n5\n10 20 30 40 50"}
                className="flex-1 min-h-[100px] sm:min-h-[120px] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#070b14] border border-slate-300/80 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono text-[11px] sm:text-xs focus:outline-none focus:ring-1.5 focus:ring-primary/40 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-white/[0.08]">
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                Feeds into `scanf()` when you click Run.
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onBatchStdinChange("")}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px] sm:text-xs cursor-pointer bg-slate-200/60 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Clear
                </button>
                {onRun && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("terminal");
                      onRun();
                    }}
                    className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold bg-primary hover:bg-primary/90 text-white text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm shadow-primary/20 cursor-pointer"
                  >
                    <Play className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
                    <span>Run</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Copy,
  Check,
  FolderInput,
  Lock,
  Code2,
  BookOpen,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { DSALibraryProgram } from "@/lib/data/dsaLibrary";
import { useToastStore } from "@/lib/store/useToastStore";
import { VSCodeSyntaxViewer } from "@/components/explore/VSCodeSyntaxViewer";
import { ScrollableNav } from "@/components/ui/ScrollableNav";

interface DSALibraryModalProps {
  program: DSALibraryProgram | null;
  onClose: () => void;
  onImport: (program: DSALibraryProgram) => Promise<void>;
  isImporting: boolean;
}

export function DSALibraryModal({
  program,
  onClose,
  onImport,
  isImporting,
}: DSALibraryModalProps) {
  const [activeTab, setActiveTab] = useState<"code" | "functions" | "io" | "complexity">("code");
  const [copied, setCopied] = useState(false);

  if (!program) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(program.code);
    setCopied(true);
    useToastStore.getState().addToast("C source code copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-4 border-b border-border bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary">
                  {program.topic} &bull; {program.subtopic}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/10">
                  <Lock className="w-2.5 h-2.5" /> Read-Only
                </span>
                <span
                  className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                    program.difficulty === "Beginner"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : program.difficulty === "Intermediate"
                      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                      : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                  }`}
                >
                  {program.difficulty}
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-extrabold text-foreground truncate mt-0.5">
                {program.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2 sm:ml-3">
            {/* Import to Workspace Button */}
            <button
              type="button"
              onClick={() => onImport(program)}
              disabled={isImporting}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              title="Create an editable copy in your workspace"
            >
              <FolderInput className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span className="hidden sm:inline">
                {isImporting ? "Importing..." : "Import to My Workspace"}
              </span>
              <span className="sm:hidden">{isImporting ? "..." : "Import"}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar with Left/Right Arrows */}
        <div className="px-3 sm:px-5 pt-1 border-b border-border bg-slate-100/50 dark:bg-slate-900/50 flex-shrink-0">
          <ScrollableNav className="gap-1">
            {[
              { id: "code", label: "C Source Code", icon: Code2 },
              { id: "functions", label: `Functions (${program.functions.length})`, icon: BookOpen },
              { id: "io", label: "Sample Input & Output", icon: Terminal },
              { id: "complexity", label: "Complexity & Logic", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </ScrollableNav>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-6">
          {/* TAB 1: C SOURCE CODE (READ-ONLY) */}
          {activeTab === "code" && (
            <div className="space-y-3">
              {/* Info banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>
                    <strong>Read-Only Reference Code.</strong> To run, edit, or customize this code, click{" "}
                    <button
                      type="button"
                      onClick={() => onImport(program)}
                      className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                    >
                      Import to My Workspace
                    </button>
                    .
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-secondary text-foreground text-xs font-semibold border border-border shadow-xs cursor-pointer transition-all active:scale-95 flex-shrink-0 ml-2"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              {/* VS Code Style Colorful Syntax Viewer */}
              <VSCodeSyntaxViewer
                code={program.code}
                filename={program.filename}
                maxHeight="480px"
              />
            </div>
          )}

          {/* TAB 2: FUNCTIONS BREAKDOWN */}
          {activeTab === "functions" && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                This implementation follows strict modular programming standards. Every operation is cleanly isolated
                into its own user-defined function for academic lab and interview preparation:
              </div>

              <div className="grid grid-cols-1 gap-3">
                {program.functions.map((fn, idx) => (
                  <div
                    key={fn.name}
                    className="p-4 rounded-2xl border border-border bg-slate-50/50 dark:bg-slate-800/40 space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <code className="text-xs font-bold text-primary font-mono">{fn.name}</code>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto">
                      {fn.signature}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-1">{fn.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SAMPLE INPUT & OUTPUT */}
          {activeTab === "io" && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Actual execution trace demonstrating how this program behaves when compiled and run with interactive{" "}
                <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[11px]">scanf()</code> inputs:
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-[#070b14] text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 mb-2 pb-2 border-b border-white/10">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Interactive Terminal Run Simulation</span>
                </div>
                <pre className="whitespace-pre text-slate-200 font-mono">{program.sampleInputOutput}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: COMPLEXITY & LOGIC */}
          {activeTab === "complexity" && (
            <div className="space-y-6">
              {/* Overview Explanation */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Concept & Logic Explanation</span>
                </h3>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs text-foreground/90 leading-relaxed space-y-2">
                  <p>{program.explanation}</p>
                  <p className="text-muted-foreground">{program.summary}</p>
                </div>
              </div>

              {/* Time & Space Complexity Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Time Complexity
                  </p>
                  <p className="text-sm font-extrabold text-foreground font-mono">{program.timeComplexity}</p>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Space Complexity
                  </p>
                  <p className="text-sm font-extrabold text-foreground font-mono">{program.spaceComplexity}</p>
                </div>
              </div>

              {/* Operations Covered */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">Operations Covered in this Implementation</h3>
                <div className="flex flex-wrap gap-2">
                  {program.operations.map((op) => (
                    <span
                      key={op}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md flex-shrink-0">
          <div className="text-xs text-muted-foreground hidden sm:block">
            File: <code className="font-mono text-foreground font-bold">{program.filename}</code> &bull; Verified C11
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-colors"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>

            <button
              type="button"
              onClick={() => onImport(program)}
              disabled={isImporting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <FolderInput className="w-4 h-4" />
              <span>{isImporting ? "Importing..." : "Import to My Workspace"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

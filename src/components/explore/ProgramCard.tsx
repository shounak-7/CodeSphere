"use client";

import {
  BookOpen,
  FolderInput,
  Clock,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { DSALibraryProgram } from "@/lib/data/dsaLibrary";

interface ProgramCardProps {
  program: DSALibraryProgram;
  onInspect: (program: DSALibraryProgram) => void;
  onImport: (program: DSALibraryProgram) => void;
  isImporting: boolean;
  showFolderBadge?: boolean;
  onSelectFolder?: (topicId: string) => void;
}

export function ProgramCard({
  program,
  onInspect,
  onImport,
  isImporting,
  showFolderBadge = false,
  onSelectFolder,
}: ProgramCardProps) {
  // Extract first 4 meaningful code lines for a VS Code style mini preview
  const codeLines = program.code
    .split("\n")
    .filter((line) => !line.trim().startsWith("//") && line.trim().length > 0)
    .slice(0, 4);

  return (
    <div className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-border/70 dark:border-white/[0.08] bg-card p-3.5 sm:p-6 shadow-xs hover:shadow-lg hover:border-primary/40 dark:hover:border-primary/40 transition-all duration-200 group">
      <div className="space-y-2.5 sm:space-y-4">
        {/* Top Header: Filename badge, Topic Tag & Difficulty */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-mono font-medium bg-secondary text-foreground border border-border/60">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{program.filename}</span>
            </span>

            {showFolderBadge && onSelectFolder && (
              <button
                type="button"
                onClick={() => onSelectFolder(program.topicId)}
                className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title={`Go to ${program.topic} folder`}
              >
                <span>{program.topic}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
              </button>
            )}
          </div>

          <span
            className={`px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium ${
              program.difficulty === "Beginner"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : program.difficulty === "Intermediate"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
            }`}
          >
            {program.difficulty}
          </span>
        </div>

        {/* Program Title */}
        <h3
          onClick={() => onInspect(program)}
          className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug cursor-pointer"
        >
          {program.title}
        </h3>

        {/* Summary Description */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {program.summary}
        </p>

        {/* VS Code Style Color-Coded Syntax Snippet Preview */}
        <div
          onClick={() => onInspect(program)}
          className="rounded-lg sm:rounded-xl border border-border/50 dark:border-white/[0.08] bg-slate-950 text-slate-100 p-2.5 sm:p-3.5 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-hidden cursor-pointer shadow-inner relative group/code"
        >
          {/* Header dots */}
          <div className="flex items-center justify-between pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 border-b border-white/10 text-[9px] sm:text-[10px] text-slate-400 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500/80" />
              <span className="w-2 h-2 rounded-full bg-amber-500/80" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              <span className="ml-1 text-slate-400 font-mono text-[9px] sm:text-[10px]">{program.filename}</span>
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase font-mono text-slate-400">C11</span>
          </div>

          {/* Code lines */}
          <div className="space-y-0.5 sm:space-y-1 font-mono select-none">
            {codeLines.map((line, idx) => (
              <div key={idx} className="truncate flex items-center gap-1.5 sm:gap-2">
                <span className="text-slate-600 select-none text-[9px] sm:text-[10px] w-3.5 sm:w-4 text-right">{idx + 1}</span>
                <span className="truncate">
                  {line.includes("#include") ? (
                    <>
                      <span className="text-violet-400 font-medium">#include </span>
                      <span className="text-amber-300">{line.replace("#include", "").trim()}</span>
                    </>
                  ) : line.includes("int ") || line.includes("void ") || line.includes("char ") ? (
                    <>
                      <span className="text-cyan-400 font-medium">{line.split(" ")[0]} </span>
                      <span className="text-yellow-200">{line.substring(line.indexOf(" ") + 1)}</span>
                    </>
                  ) : (
                    <span className="text-slate-300">{line}</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 bg-primary/0 group-hover/code:bg-primary/5 transition-colors flex items-center justify-center pointer-events-none">
            <span className="opacity-0 group-hover/code:opacity-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-slate-900/95 text-white text-[10px] sm:text-[11px] font-sans font-medium shadow-md transition-opacity">
              Click to view source ({program.functions.length} functions)
            </span>
          </div>
        </div>

        {/* Operations Pills */}
        <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5">
          {program.operations.slice(0, 3).map((op) => (
            <span
              key={op}
              className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-secondary/50 text-muted-foreground"
            >
              {op}
            </span>
          ))}
          {program.operations.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] text-muted-foreground/70">
              +{program.operations.length - 3}
            </span>
          )}
        </div>

        {/* Time and Space Complexity Bar */}
        <div className="p-2 sm:p-2.5 rounded-md sm:rounded-lg bg-secondary/40 border border-border/40 flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
          <span className="text-muted-foreground truncate mr-2 flex items-center gap-1 sm:gap-1.5">
            <Clock className="w-3 h-3 text-primary" />
            <span>Time: </span>
            <strong className="text-foreground">{program.timeComplexity.split(",")[0]}</strong>
          </span>
          <span className="text-muted-foreground shrink-0 flex items-center gap-1 sm:gap-1.5">
            <Cpu className="w-3 h-3 text-emerald-500" />
            <span>Space: </span>
            <strong className="text-foreground">{program.spaceComplexity}</strong>
          </span>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-2.5 sm:pt-4 mt-3 sm:mt-5 border-t border-border/40 flex items-center justify-between gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onInspect(program)}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
        >
          <BookOpen className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary" />
          <span>Study & Inspect</span>
        </button>

        <button
          type="button"
          onClick={() => onImport(program)}
          disabled={isImporting}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium text-white bg-primary hover:bg-primary/90 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          title="Import editable copy into personal workspace"
        >
          <FolderInput className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          <span>{isImporting ? "Importing..." : "Import"}</span>
        </button>
      </div>
    </div>
  );
}

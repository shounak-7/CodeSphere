"use client";

import {
  Folder,
  FolderOpen,
  ChevronRight,
  LayoutGrid,
  Layers,
  ListOrdered,
  GitCommit,
  Network,
  Share2,
  ArrowDownAZ,
  Binary,
  Hash,
  Repeat,
  Type,
  Table,
  Cpu,
  BookOpen,
} from "lucide-react";
import { DSATopic } from "@/lib/data/dsaLibrary";

interface FolderCardProps {
  topic: DSATopic;
  programCount: number;
  operationsPreview: string[];
  onClick: () => void;
}

// Icon dictionary mapped to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Layers,
  ListOrdered,
  GitCommit,
  Network,
  Share2,
  ArrowDownAZ,
  Binary,
  Hash,
  Repeat,
  Type,
  Table,
  Cpu,
  BookOpen,
};

export function FolderCard({
  topic,
  programCount,
  operationsPreview,
  onClick,
}: FolderCardProps) {
  const IconComponent = ICON_MAP[topic.iconName] || Folder;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col justify-between p-3.5 sm:p-7 rounded-xl sm:rounded-2xl border border-border/70 dark:border-white/[0.08] bg-card hover:bg-card/95 hover:border-primary/40 dark:hover:border-primary/40 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer text-left select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:-translate-y-0.5"
    >
      <div>
        {/* Top Header: Distinct Category Icon Badge + Subtle Category Label */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          <div
            className={`w-10 sm:w-14 h-10 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0 ${topic.colorScheme.bg} ${topic.colorScheme.border} ${topic.colorScheme.text}`}
          >
            <IconComponent className="w-5 sm:w-7 h-5 sm:h-7" />
          </div>

          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground bg-secondary/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
            {topic.category}
          </span>
        </div>

        {/* Topic Title */}
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors mt-2.5 sm:mt-4">
          {topic.name}
        </h3>

        {/* Short & Clean Description */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 sm:mt-1.5 leading-relaxed">
          {topic.description}
        </p>

        {/* Operations Preview as subtle muted tags */}
        {operationsPreview.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-border/40">
            {operationsPreview.slice(0, 3).map((op) => (
              <span
                key={op}
                className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-secondary/50 text-muted-foreground"
              >
                {op}
              </span>
            ))}
            {operationsPreview.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] text-muted-foreground/70">
                +{operationsPreview.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-2.5 sm:pt-4 mt-3 sm:mt-5 border-t border-border/40 flex items-center justify-between text-[11px] sm:text-xs">
        <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
          {programCount} {programCount === 1 ? "program" : "programs"}
        </span>

        <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
          <span>Open Folder</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  );
}

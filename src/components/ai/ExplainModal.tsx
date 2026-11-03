"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, Copy, Check, BookOpen, AlertTriangle, Lightbulb } from "lucide-react";
import { ExplanationMode } from "@/lib/ai/gemini";

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

const MODES: { id: ExplanationMode; label: string; icon: string }[] = [
  { id: "complete", label: "Complete Overview", icon: "📋" },
  { id: "beginner", label: "Beginner Friendly", icon: "🌱" },
  { id: "complexity", label: "Time & Space (Big-O)", icon: "⏱️" },
  { id: "logic", label: "Logic Breakdown", icon: "🧠" },
  { id: "line_by_line", label: "Line-by-Line", icon: "🔍" },
  { id: "bugs", label: "Find Bugs & Leaks", icon: "🐞" },
  { id: "improvements", label: "Modern Improvements", icon: "💡" },
];

export function ExplainModal({ isOpen, onClose, code }: ExplainModalProps) {
  const [selectedMode, setSelectedMode] = useState<ExplanationMode>("complete");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (mode = selectedMode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate explanation");
      }
      setExplanation(data.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error contacting AI service");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (explanation) {
      navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-xl sm:rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg sm:rounded-xl bg-violet-600/20 text-violet-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-foreground">CodeSphere AI Tutor</h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30 tracking-wide uppercase">
                  Coming Soon
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Powered by Gemini AI for C & DSA Learners</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-border bg-secondary/10 flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode.id);
                handleGenerate(mode.id);
              }}
              disabled={loading}
              className={`flex-shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
                selectedMode === mode.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto">
          {loading ? (
            <div className="h-48 sm:h-64 flex flex-col items-center justify-center gap-2.5 sm:gap-3">
              <Loader2 className="w-6 sm:w-8 h-6 sm:h-8 text-primary animate-spin" />
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Analyzing C logic and deriving algorithmic complexity...
              </p>
            </div>
          ) : error ? (
            <div className="p-3 sm:p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-start gap-2.5 sm:gap-3">
              <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to analyze code</p>
                <p className="text-[11px] sm:text-xs mt-1 text-muted-foreground">{error}</p>
                <button
                  onClick={() => handleGenerate()}
                  className="mt-2.5 sm:mt-3 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-destructive text-white text-[11px] sm:text-xs font-medium hover:bg-destructive/90"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
          ) : explanation ? (
            <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
              {explanation}
            </div>
          ) : (
            <div className="py-6 sm:h-72 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 text-muted-foreground px-2 sm:px-6">
              <div className="w-10 sm:w-14 h-10 sm:h-14 rounded-xl sm:rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-inner">
                <Sparkles className="w-5 sm:w-7 h-5 sm:h-7 animate-pulse" />
              </div>
              <div className="max-w-md">
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 mb-2">
                  <span>✨ CodeSphere Gemini AI Tutor</span>
                  <span className="text-violet-400 font-bold">• Coming Soon</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-foreground">AI Code Analysis Under Final Tuning</h4>
                <p className="text-[11px] sm:text-xs mt-1 text-muted-foreground leading-relaxed">
                  We are finalizing the dedicated Gemini AI tutoring pipeline for C pointers, recursion trees, Big-O analysis, and memory debugging. This feature will be live in the upcoming release!
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1 sm:mt-2">
                <button
                  onClick={onClose}
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-[11px] sm:text-xs font-semibold border border-border cursor-pointer transition-all"
                >
                  Got It
                </button>
                <button
                  onClick={() => handleGenerate()}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 text-[11px] sm:text-xs font-medium cursor-pointer transition-all"
                  title="Try preview analysis"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Preview Early Access</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {explanation && !loading && (
          <div className="px-3.5 sm:px-6 py-2 sm:py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-muted-foreground">CodeSphere Gemini AI Assistant</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-border text-[11px] sm:text-xs font-semibold text-foreground hover:bg-secondary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Explanation"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

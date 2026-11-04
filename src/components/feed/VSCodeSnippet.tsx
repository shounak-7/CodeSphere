"use client";

import { useState, useMemo, memo } from "react";
import { Check, Copy, FolderPlus, Code2 } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";

interface VSCodeSnippetProps {
  code: string;
  filename?: string;
  postAuthor?: string;
  onAddToWorkspace?: () => void;
  importingCode?: boolean;
}

// Tokenize a line of C code into syntax-colored spans
function highlightCLine(line: string) {
  // If line is empty or just whitespace
  if (!line.trim()) {
    return <span>&nbsp;</span>;
  }

  // Check for line comments first
  const commentIndex = line.indexOf("//");
  if (commentIndex === 0) {
    return <span className="text-[#6a9955] italic">{line}</span>;
  }

  let codePart = line;
  let commentPart = "";
  if (commentIndex > 0) {
    codePart = line.slice(0, commentIndex);
    commentPart = line.slice(commentIndex);
  }

  // Preprocessor directives like #include <stdio.h>
  const includeMatch = codePart.match(/^(\s*#\s*\w+)(\s+<[^>]+>|\s+"[^"]+")(.*)$/);
  if (includeMatch) {
    return (
      <>
        <span className="text-[#c586c0] font-semibold">{includeMatch[1]}</span>
        <span className="text-[#ce9178]">{includeMatch[2]}</span>
        <span>{includeMatch[3]}</span>
        {commentPart && <span className="text-[#6a9955] italic">{commentPart}</span>}
      </>
    );
  }

  // Regex for C tokens: strings, words, numbers, operators
  const tokenRegex = /(".*?"|'.*?'|\b[a-zA-Z_]\w*\b|\b\d+(?:\.\d+)?\b|[{}()[\];,]|[!%^&*+\-=|~<>/?:]+|\s+)/g;
  const tokens = codePart.match(tokenRegex) || [codePart];

  const types = new Set([
    "int", "char", "void", "float", "double", "long", "short",
    "unsigned", "signed", "struct", "typedef", "enum", "union",
    "size_t", "bool", "uint8_t", "uint16_t", "uint32_t", "int64_t"
  ]);

  const controlKeywords = new Set([
    "return", "if", "else", "for", "while", "do", "switch",
    "case", "default", "break", "continue", "goto"
  ]);

  const preprocessorKeywords = new Set([
    "#include", "#define", "#ifdef", "#ifndef", "#endif", "#if", "#else", "#elif"
  ]);

  const stdFunctions = new Set([
    "printf", "scanf", "malloc", "free", "calloc", "realloc",
    "sizeof", "strlen", "strcmp", "strcpy", "strcat", "main",
    "atoi", "atof", "exit", "qsort", "bsearch", "factorial",
    "createNode", "insert", "delete", "search", "display"
  ]);

  const constants = new Set(["NULL", "EOF", "EXIT_SUCCESS", "EXIT_FAILURE", "true", "false"]);

  return (
    <>
      {tokens.map((token, idx) => {
        // String literal
        if (token.startsWith('"') || token.startsWith("'")) {
          return <span key={idx} className="text-[#ce9178]">{token}</span>;
        }
        // Number literal
        if (/^\d+(?:\.\d+)?$/.test(token)) {
          return <span key={idx} className="text-[#b5cea8]">{token}</span>;
        }
        // Types
        if (types.has(token)) {
          return <span key={idx} className="text-[#4ec9b0] font-medium">{token}</span>;
        }
        // Control flow
        if (controlKeywords.has(token)) {
          return <span key={idx} className="text-[#c586c0] font-semibold">{token}</span>;
        }
        // Preprocessor
        if (preprocessorKeywords.has(token)) {
          return <span key={idx} className="text-[#c586c0] font-semibold">{token}</span>;
        }
        // Standard / Common functions
        if (stdFunctions.has(token)) {
          return <span key={idx} className="text-[#dcdcaa]">{token}</span>;
        }
        // Constants
        if (constants.has(token)) {
          return <span key={idx} className="text-[#4fc1ff] font-semibold">{token}</span>;
        }
        // Punctuation / brackets
        if (/^[{}()[\];,]$/.test(token)) {
          return <span key={idx} className="text-[#ffd700]">{token}</span>;
        }
        // Default text / identifier / spaces
        return <span key={idx} className="text-[#d4d4d4]">{token}</span>;
      })}
      {commentPart && <span className="text-[#6a9955] italic">{commentPart}</span>}
    </>
  );
}

function VSCodeSnippetComponent({
  code,
  filename = "solution.c",
  onAddToWorkspace,
  importingCode = false,
}: VSCodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => {
    return code.replace(/\r\n/g, "\n").split("\n");
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    useToastStore.getState().addToast("Code snippet copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg sm:rounded-xl border border-[#2d3142]/80 dark:border-slate-800 bg-[#181824] shadow-lg overflow-hidden mb-2.5 sm:mb-4 font-mono">
      {/* VS Code Titlebar / Tab Header */}
      <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#12121a] border-b border-[#2d3142]/60 flex items-center justify-between gap-2 select-none">
        {/* Left: Mac window buttons + Active Tab */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 pr-2 border-r border-[#2d3142]/60 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90 inline-block shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90 inline-block shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90 inline-block shadow-2xs" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-md bg-[#181824] border border-[#2d3142]/80 text-[11px] font-semibold text-slate-200 shadow-xs min-w-0">
            <span className="w-3.5 h-3.5 rounded bg-blue-600/30 text-blue-400 font-bold text-[9px] flex items-center justify-center border border-blue-500/40 shrink-0">
              C
            </span>
            <span className="truncate max-w-[90px] sm:max-w-[180px]">{filename}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onAddToWorkspace && (
            <button
              type="button"
              onClick={onAddToWorkspace}
              disabled={importingCode}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
              title="Save this C code into your Personal Workspace"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">{importingCode ? "Adding..." : "Add to Workspace"}</span>
              <span className="sm:hidden">{importingCode ? "..." : "Add"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* VS Code Code Body with Line Numbers */}
      <div className="overflow-x-auto max-h-48 sm:max-h-80 py-1.5 sm:py-2.5 text-[11px] sm:text-xs leading-relaxed selection:bg-indigo-900/60 selection:text-white">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="w-8 sm:w-10 pr-2 sm:pr-3 pl-2 sm:pl-3 text-right select-none font-mono text-[10px] sm:text-[11px] text-slate-600 align-top">
                  {idx + 1}
                </td>
                <td className="pl-1.5 sm:pl-2 pr-3 sm:pr-4 font-mono text-[11px] sm:text-xs whitespace-pre select-text">
                  {highlightCLine(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const VSCodeSnippet = memo(VSCodeSnippetComponent);

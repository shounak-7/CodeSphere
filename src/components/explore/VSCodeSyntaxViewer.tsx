"use client";

import { useMemo, useState } from "react";
import { Copy, Check, FileCode2 } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";

interface VSCodeSyntaxViewerProps {
  code: string;
  filename: string;
  maxHeight?: string;
}

// Token types for VS Code C11 syntax highlighting
type TokenType =
  | "comment"
  | "preprocessor"
  | "header"
  | "string"
  | "keyword"
  | "type"
  | "number"
  | "function"
  | "operator"
  | "text";

interface Token {
  type: TokenType;
  text: string;
}

const C_KEYWORDS = new Set([
  "return",
  "if",
  "else",
  "while",
  "for",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "typedef",
  "struct",
  "sizeof",
  "enum",
  "union",
  "default",
  "goto",
  "static",
  "const",
  "auto",
  "register",
  "volatile",
]);

const C_TYPES = new Set([
  "int",
  "char",
  "void",
  "float",
  "double",
  "long",
  "short",
  "unsigned",
  "signed",
  "size_t",
  "bool",
  "Node",
  "DNode",
  "AVLNode",
  "Queue",
  "Stack",
  "Graph",
]);

const C_CONSTANTS = new Set(["NULL", "true", "false", "EOF", "EXIT_SUCCESS", "EXIT_FAILURE"]);

// Tokenize a single line of C code with VS Code Dark+ color mappings
function tokenizeCLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    // 1. Line Comments (// ...)
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ type: "comment", text: line.slice(i) });
      break;
    }

    // 2. Preprocessor directive (#include <...>, #define ...)
    if (line[i] === "#" && (i === 0 || line.slice(0, i).trim() === "")) {
      const match = line.slice(i).match(/^(#\s*[a-zA-Z_]+)(\s*<[^>]+>)?/);
      if (match) {
        tokens.push({ type: "preprocessor", text: match[1] });
        i += match[1].length;
        if (match[2]) {
          tokens.push({ type: "header", text: match[2] });
          i += match[2].length;
        }
        continue;
      }
    }

    // 3. String literals ("...")
    if (line[i] === '"') {
      let str = '"';
      i++;
      while (i < len && line[i] !== '"') {
        if (line[i] === "\\" && i + 1 < len) {
          str += line[i] + line[i + 1];
          i += 2;
        } else {
          str += line[i];
          i++;
        }
      }
      if (i < len && line[i] === '"') {
        str += '"';
        i++;
      }
      tokens.push({ type: "string", text: str });
      continue;
    }

    // 4. Character literals ('...')
    if (line[i] === "'") {
      let ch = "'";
      i++;
      while (i < len && line[i] !== "'") {
        if (line[i] === "\\" && i + 1 < len) {
          ch += line[i] + line[i + 1];
          i += 2;
        } else {
          ch += line[i];
          i++;
        }
      }
      if (i < len && line[i] === "'") {
        ch += "'";
        i++;
      }
      tokens.push({ type: "string", text: ch });
      continue;
    }

    // 5. Identifiers, Keywords, Types, Numbers, and Functions
    if (/[a-zA-Z_]/.test(line[i])) {
      let word = "";
      while (i < len && /[a-zA-Z0-9_]/.test(line[i])) {
        word += line[i];
        i++;
      }

      // Check if immediately followed by '(' -> Function call/definition
      let j = i;
      while (j < len && (line[j] === " " || line[j] === "\t")) j++;
      const isFunction = j < len && line[j] === "(";

      if (C_KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", text: word });
      } else if (C_TYPES.has(word)) {
        tokens.push({ type: "type", text: word });
      } else if (C_CONSTANTS.has(word)) {
        tokens.push({ type: "number", text: word });
      } else if (isFunction) {
        tokens.push({ type: "function", text: word });
      } else {
        tokens.push({ type: "text", text: word });
      }
      continue;
    }

    // 6. Numeric Literals
    if (/[0-9]/.test(line[i])) {
      let num = "";
      while (i < len && /[0-9xXa-fA-F.]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push({ type: "number", text: num });
      continue;
    }

    // 7. Operators & Pointers (->, *, &, etc.)
    if (line[i] === "-" && line[i + 1] === ">") {
      tokens.push({ type: "operator", text: "->" });
      i += 2;
      continue;
    }

    if (/[+\-*/%=&|!<>?:;.,{}()\[\]]/.test(line[i])) {
      tokens.push({ type: "operator", text: line[i] });
      i++;
      continue;
    }

    // 8. Whitespace and other characters
    tokens.push({ type: "text", text: line[i] });
    i++;
  }

  return tokens;
}

// VS Code Dark+ / Light syntax color mapping classes
const TOKEN_CLASSES: Record<TokenType, string> = {
  comment: "text-[#6a9955] dark:text-[#6a9955] italic", // VS Code Green
  preprocessor: "text-[#af00db] dark:text-[#c586c0] font-semibold", // VS Code Purple
  header: "text-[#a31515] dark:text-[#ce9178]", // VS Code Orange/Warm
  string: "text-[#a31515] dark:text-[#ce9178]", // VS Code Warm String
  keyword: "text-[#0000ff] dark:text-[#569cd6] font-semibold", // VS Code Blue Keyword
  type: "text-[#267f99] dark:text-[#4ec9b0] font-semibold", // VS Code Teal Type
  number: "text-[#098658] dark:text-[#b5cea8]", // VS Code Light Green
  function: "text-[#795e26] dark:text-[#dcdcaa] font-medium", // VS Code Function Yellow
  operator: "text-slate-700 dark:text-[#d4d4d4]", // VS Code Operator
  text: "text-slate-900 dark:text-[#9cdcfe]", // VS Code Identifier/Variable
};

export function VSCodeSyntaxViewer({
  code,
  filename,
  maxHeight = "520px",
}: VSCodeSyntaxViewerProps) {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => {
    return code.split("\n");
  }, [code]);

  const tokenizedLines = useMemo(() => {
    return lines.map((line) => tokenizeCLine(line));
  }, [lines]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    useToastStore.getState().addToast("C source code copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-[#ffffff] dark:bg-[#1e1e1e] overflow-hidden shadow-xl transition-colors">
      {/* VS Code Window Top Toolbar */}
      <div className="flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#f3f4f6] dark:bg-[#252526] border-b border-slate-200 dark:border-white/[0.08] select-none text-xs">
        {/* Left: Traffic light dots & Active Tab */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#27c93f] inline-block shadow-xs" />
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-mono text-[10px] sm:text-[11px] font-bold shadow-xs">
            <FileCode2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-500" />
            <span>{filename}</span>
          </div>
        </div>

        {/* Right: GCC version pill & Copy button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-400">
            C11 GCC Standard
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-white dark:bg-[#2d2d2d] hover:bg-slate-100 dark:hover:bg-[#383838] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Copy Source Code"
          >
            {copied ? (
              <>
                <Check className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area with Line Numbers & Syntax Highlighting */}
      <div
        style={{
          maxHeight,
          fontFamily:
            "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, 'SF Mono', Menlo, Monaco, monospace",
        }}
        className="overflow-x-auto overflow-y-auto p-2.5 sm:p-4 text-[11px] sm:text-xs font-mono leading-relaxed select-text bg-[#ffffff] dark:bg-[#1e1e1e]"
      >
        <table className="w-full border-collapse">
          <tbody>
            {tokenizedLines.map((tokens, lineIdx) => (
              <tr key={lineIdx} className="hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                {/* Line number gutter */}
                <td className="w-7 sm:w-10 pr-2 sm:pr-4 text-right select-none text-slate-400 dark:text-[#858585] text-[10px] sm:text-[11px] font-mono align-top border-r border-slate-200 dark:border-white/[0.08]">
                  {lineIdx + 1}
                </td>

                {/* Formatted code line */}
                <td className="pl-2 sm:pl-4 whitespace-pre font-mono text-[11px] sm:text-[12px] align-top">
                  {tokens.length === 0 || (tokens.length === 1 && tokens[0].text === "") ? (
                    <span>&nbsp;</span>
                  ) : (
                    tokens.map((token, tokenIdx) => (
                      <span key={tokenIdx} className={TOKEN_CLASSES[token.type]}>
                        {token.text}
                      </span>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

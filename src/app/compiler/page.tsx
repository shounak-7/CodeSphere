"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CodeEditor } from "@/components/editor/MonacoEditor";
import { ExplainModal } from "@/components/ai/ExplainModal";
import { UnifiedTerminal } from "@/components/compiler/UnifiedTerminal";
import { useCompilerRunner } from "@/lib/compiler/useCompilerRunner";
import { useToastStore } from "@/lib/store/useToastStore";
import {
  Play,
  Square,
  Trash2,
  Download,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Code2,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const SAMPLE_PROGRAMS: Record<string, { title: string; code: string; defaultStdin?: string }> = {
  hello: {
    title: "1. Hello World",
    code: `#include <stdio.h>

int main() {
    printf("Welcome to CodeSphere Online C Compiler!\\n");
    printf("Standard: C11 (GCC)\\n");
    return 0;
}`,
  },
  scanf: {
    title: "2. Interactive scanf (Input)",
    code: `#include <stdio.h>

int main() {
    int a, b;
    printf("Enter first number: ");
    if (scanf("%d", &a) != 1) return 1;
    
    printf("You entered: %d\\n", a);
    printf("Enter second number: ");
    if (scanf("%d", &b) != 1) return 1;

    printf("Sum: %d + %d = %d\\n", a, b, a + b);
    printf("Product: %d * %d = %d\\n", a, b, a * b);
    return 0;
}`,
  },
  recursion: {
    title: "3. Recursive Factorial",
    code: `#include <stdio.h>

long long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    printf("Factorial of 5: %lld\\n", factorial(5));
    printf("Factorial of 10: %lld\\n", factorial(10));
    return 0;
}`,
  },
  linkedlist: {
    title: "4. Singly Linked List",
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int val;
    struct Node* next;
} Node;

Node* insert_head(Node* head, int val) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->val = val;
    n->next = head;
    return n;
}

void print_list(Node* head) {
    Node* curr = head;
    printf("List: ");
    while (curr) {
        printf("[%d] -> ", curr->val);
        curr = curr->next;
    }
    printf("NULL\\n");
}

int main() {
    Node* head = NULL;
    head = insert_head(head, 30);
    head = insert_head(head, 20);
    head = insert_head(head, 10);
    
    print_list(head);

    // Free memory
    while (head) {
        Node* tmp = head;
        head = head->next;
        free(tmp);
    }
    return 0;
}`,
  },
  bst: {
    title: "5. Binary Search Tree",
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct TreeNode {
    int key;
    struct TreeNode *left, *right;
} TreeNode;

TreeNode* new_node(int item) {
    TreeNode* temp = (TreeNode*)malloc(sizeof(TreeNode));
    temp->key = item;
    temp->left = temp->right = NULL;
    return temp;
}

TreeNode* insert(TreeNode* node, int key) {
    if (node == NULL) return new_node(key);
    if (key < node->key)
        node->left = insert(node->left, key);
    else if (key > node->key)
        node->right = insert(node->right, key);
    return node;
}

void inorder(TreeNode* root) {
    if (root != NULL) {
        inorder(root->left);
        printf("%d ", root->key);
        inorder(root->right);
    }
}

int main() {
    TreeNode* root = NULL;
    root = insert(root, 50);
    insert(root, 30);
    insert(root, 20);
    insert(root, 40);
    insert(root, 70);
    insert(root, 60);
    insert(root, 80);

    printf("Inorder Traversal of BST: ");
    inorder(root);
    printf("\\n");
    return 0;
}`,
  },
};

export default function CompilerPage() {
  const [code, setCode] = useState(SAMPLE_PROGRAMS.hello.code);
  const [showAiModal, setShowAiModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "terminal">("editor");

  const {
    stdout,
    stderr,
    terminalEntries,
    problems,
    isRunning,
    status,
    exitCode,
    durationMs,
    runCode,
    sendInput,
    sendEof,
    killSession,
    clearTerminal,
  } = useCompilerRunner();

  // Proactively wake up and warm Render compiler engine
  useEffect(() => {
    fetch("/api/compiler/ping").catch(() => {});
    const heartbeat = setInterval(() => {
      fetch("/api/compiler/ping").catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(heartbeat);
  }, []);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to execute code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode(code);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, runCode]);

  const handleSelectPreset = (key: string) => {
    const preset = SAMPLE_PROGRAMS[key];
    if (preset) {
      setCode(preset.code);
      clearTerminal();
      useToastStore.getState().addToast(`Loaded ${preset.title}`, "info");
    }
  };

  const handleRun = () => {
    if (window.innerWidth < 1024) {
      setMobileTab("terminal");
    }
    runCode(code);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    useToastStore.getState().addToast("Code copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/x-csrc" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "program.c";
    a.click();
    URL.revokeObjectURL(url);
    useToastStore.getState().addToast("Downloaded program.c", "success");
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-background">
        {/* Top Compiler Toolbar */}
        <div className="h-11 sm:h-14 px-2 sm:px-4 border-b border-border bg-card/70 backdrop-blur-md flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
            {/* Mobile View Switcher Pill */}
            <div className="lg:hidden flex items-center p-0.5 rounded-lg bg-secondary border border-border shrink-0 mr-1">
              <button
                type="button"
                onClick={() => setMobileTab("editor")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  mobileTab === "editor"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("terminal")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  mobileTab === "terminal"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Terminal
              </button>
            </div>

            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline flex-shrink-0">
              Presets:
            </span>
            {Object.entries(SAMPLE_PROGRAMS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-lg sm:rounded-xl font-medium border border-border bg-secondary/80 hover:bg-secondary text-foreground transition-colors flex-shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* AI Explanation Button */}
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-violet-300 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Explain Code with CodeSphere AI Tutor"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Explain with AI</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors cursor-pointer"
              title="Copy Source Code"
              aria-label="Copy Source Code"
            >
              {copied ? <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors cursor-pointer"
              title="Download as .c file"
              aria-label="Download as .c file"
            >
              <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>

            {/* Big, High-Contrast Run Program Button with Shortcut */}
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer border border-emerald-500/40"
              title="Compile & Run C Program (Ctrl+Enter)"
              aria-label="Compile and Run C Program"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
                  <span>Run</span>
                  <span className="hidden md:inline px-1.5 py-0.5 rounded bg-black/25 text-[10px] text-emerald-200 font-mono">
                    Ctrl+Enter
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Split Layout: Editor on Left, Interactive Terminal on Right */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left: Code Editor (7 cols on lg) */}
          <div className={`lg:col-span-7 h-full flex flex-col overflow-hidden bg-card ${mobileTab === "editor" ? "flex" : "hidden lg:flex"}`}>
            <div className="h-8 sm:h-9 px-3 sm:px-4 border-b border-border bg-secondary/40 flex items-center justify-between text-xs text-muted-foreground select-none">
              <span className="font-mono flex items-center gap-1.5 text-foreground font-semibold text-[11px] sm:text-xs">
                <Code2 className="w-3.5 h-3.5 text-primary" /> main.c
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono bg-secondary px-1.5 sm:px-2 py-0.5 rounded border border-border/80">
                GCC 11 C11
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor code={code} onChange={(val) => setCode(val || "")} />
            </div>
          </div>

          {/* Right: Unified VS Code Style Terminal (5 cols on lg) */}
          <div className={`lg:col-span-5 h-full overflow-hidden flex flex-col ${mobileTab === "terminal" ? "flex" : "hidden lg:flex"}`}>
            <UnifiedTerminal
              stdout={stdout}
              stderr={stderr}
              terminalEntries={terminalEntries}
              problems={problems}
              isRunning={isRunning}
              status={status}
              exitCode={exitCode}
              durationMs={durationMs}
              onClear={clearTerminal}
              onRun={handleRun}
              onSendInput={sendInput}
              onSendEof={sendEof}
              onKill={killSession}
            />
          </div>
        </div>

        {/* Gemini AI Explanation Modal */}
        <ExplainModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          code={code}
        />
      </div>
    </AppShell>
  );
}

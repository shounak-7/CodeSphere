"use client";

import { useState, useRef, useCallback } from "react";

export interface TerminalEntry {
  id: string;
  type: "stdout" | "stderr" | "input" | "system" | "exit";
  text: string;
  code?: number;
  durationMs?: number;
}

export interface CompilerProblem {
  id: string;
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "note";
  message: string;
  snippet?: string;
}

export function parseCompilerDiagnostics(rawStderr: string): CompilerProblem[] {
  if (!rawStderr) return [];
  const lines = rawStderr.split("\n");
  const problems: CompilerProblem[] = [];

  // Pattern: (path/)filename.c:line:col: (error|warning|note): message
  const problemRegex = /^(?:.*\/)?([^/:\n]+\.c):(\d+):(\d+):\s+(error|warning|note):\s+(.*)$/i;

  let currentProblem: CompilerProblem | null = null;
  let snippetLines: string[] = [];

  for (const line of lines) {
    const match = line.match(problemRegex);
    if (match) {
      if (currentProblem) {
        currentProblem.snippet = snippetLines.join("\n").trim();
        problems.push(currentProblem);
        snippetLines = [];
      }
      currentProblem = {
        id: Math.random().toString(36).substring(2, 9),
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4].toLowerCase() as "error" | "warning" | "note",
        message: match[5],
      };
    } else if (currentProblem) {
      if (line.trim().length > 0) {
        snippetLines.push(line);
      }
    }
  }

  if (currentProblem) {
    currentProblem.snippet = snippetLines.join("\n").trim();
    problems.push(currentProblem);
  }

  return problems;
}

export interface CompilerRunnerState {
  stdout: string;
  stderr: string;
  terminalEntries: TerminalEntry[];
  problems: CompilerProblem[];
  isRunning: boolean;
  status: "idle" | "running" | "success" | "error";
  exitCode: number | null;
  durationMs: number | null;
  activeSessionId: string | null;
  runCode: (code: string, fallbackStdin?: string) => Promise<void>;
  sendInput: (line: string) => Promise<boolean>;
  sendEof: () => Promise<boolean>;
  killSession: () => Promise<void>;
  clearTerminal: () => void;
}

export function useCompilerRunner(): CompilerRunnerState {
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  const [problems, setProblems] = useState<CompilerProblem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSessionRef = useRef<string | null>(null);
  const activeTokenRef = useRef<string | null>(null);
  const inputUrlRef = useRef<string | null>(null);
  const killUrlRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearTerminal = useCallback(() => {
    setStdout("");
    setStderr("");
    setTerminalEntries([]);
    setProblems([]);
    setStatus("idle");
    setExitCode(null);
    setDurationMs(null);
  }, []);

  const killSession = useCallback(async () => {
    const sid = activeSessionRef.current;
    const killUrl = killUrlRef.current || (sid ? `/api/compiler/session/${sid}/kill` : null);
    const token = activeTokenRef.current;
    if (killUrl) {
      try {
        await fetch(killUrl, {
          method: "POST",
          headers: token ? { "x-session-token": token } : {},
        });
      } catch {}
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeSessionRef.current = null;
    activeTokenRef.current = null;
    inputUrlRef.current = null;
    killUrlRef.current = null;
    setActiveSessionId(null);
    setIsRunning(false);
    setStatus("idle");
    setTerminalEntries((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: "system",
        text: "[Process terminated by user]",
      },
    ]);
  }, []);

  const sendInput = useCallback(async (line: string): Promise<boolean> => {
    const sid = activeSessionRef.current;
    const inputUrl = inputUrlRef.current || (sid ? `/api/compiler/session/${sid}/input` : null);
    const token = activeTokenRef.current;
    if (!inputUrl) return false;

    // Record the user input immediately in terminal entries for responsive feedback
    setTerminalEntries((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: "input",
        text: line,
      },
    ]);

    try {
      const res = await fetch(inputUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-session-token": token } : {}),
        },
        body: JSON.stringify({ input: line }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const sendEof = useCallback(async (): Promise<boolean> => {
    const sid = activeSessionRef.current;
    const inputUrl = inputUrlRef.current || (sid ? `/api/compiler/session/${sid}/input` : null);
    const token = activeTokenRef.current;
    if (!inputUrl) return false;

    setTerminalEntries((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: "system",
        text: "^D (EOF sent to stdin)",
      },
    ]);

    try {
      const res = await fetch(inputUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-session-token": token } : {}),
        },
        body: JSON.stringify({ input: "", isEof: true }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const runCode = useCallback(async (code: string, fallbackStdin = "") => {
    if (activeSessionRef.current) {
      await killSession();
    }

    setIsRunning(true);
    setStatus("running");
    setStdout("");
    setStderr("");
    setTerminalEntries([]);
    setProblems([]);
    setExitCode(null);
    setDurationMs(null);

    const startTime = Date.now();

    // Render cold-start helper notice if container takes > 2.5s
    let isSlow = false;
    const slowTimer = setTimeout(() => {
      isSlow = true;
      setTerminalEntries([
        {
          id: "cloud-spin",
          type: "system",
          text: "⚡ Connecting to cloud GCC sandbox engine (waking up container if sleeping)...",
        },
      ]);
    }, 2500);

    try {
      // 1. Start interactive session
      const startRes = await fetch("/api/compiler/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      clearTimeout(slowTimer);
      const startData = await startRes.json();

      if (!startRes.ok || !startData.success || !startData.sessionId) {
        setIsRunning(false);
        setStatus("error");
        setExitCode(1);
        const errText = startData.error || "Compilation failed";
        setStderr(errText);
        setProblems(parseCompilerDiagnostics(errText));
        setTerminalEntries([
          {
            id: "err-1",
            type: "stderr",
            text: errText,
          },
        ]);
        setDurationMs(Date.now() - startTime);
        return;
      }

      const sessionId = startData.sessionId;
      activeSessionRef.current = sessionId;
      activeTokenRef.current = startData.token || null;
      inputUrlRef.current = startData.inputUrl || null;
      killUrlRef.current = startData.killUrl || null;
      setActiveSessionId(sessionId);

      // If we showed the cold-start message, clear it now that the container responded
      if (isSlow) {
        setTerminalEntries([]);
      }

      // 2. Connect to SSE stream (direct to Render or via Next.js proxy)
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const streamUrl = startData.streamUrl || `/api/compiler/session/${sessionId}/stream`;
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      const runDirectCompile = async () => {
        try {
          const res = await fetch("/api/compile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, stdin: fallbackStdin }),
          });
          const compData = await res.json();
          const duration = compData.durationMs ?? (Date.now() - startTime);
          setDurationMs(duration);
          setIsRunning(false);

          if (compData.success) {
            setStdout(compData.stdout || "");
            setStderr(compData.stderr || "");
            setExitCode(0);
            setStatus("success");
            setTerminalEntries([
              ...(compData.stdout
                ? [{ id: Math.random().toString(36).substring(2, 9), type: "stdout" as const, text: compData.stdout }]
                : []),
              {
                id: Math.random().toString(36).substring(2, 9),
                type: "exit" as const,
                text: `[Process completed with exit code 0]`,
                code: 0,
                durationMs: duration,
              },
            ]);
          } else {
            const errText = compData.error || compData.stderr || "Execution failed";
            setStderr(errText);
            setExitCode(compData.exitCode ?? 1);
            setStatus("error");
            setProblems(parseCompilerDiagnostics(errText));
            setTerminalEntries([
              { id: Math.random().toString(36).substring(2, 9), type: "stderr" as const, text: errText },
              {
                id: Math.random().toString(36).substring(2, 9),
                type: "exit" as const,
                text: `[Process exited with error code ${compData.exitCode ?? 1}]`,
                code: compData.exitCode ?? 1,
                durationMs: duration,
              },
            ]);
          }
        } catch {
          setIsRunning(false);
          setStatus("error");
          setExitCode(1);
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "stdout" && payload.data) {
            setStdout((prev) => prev + payload.data);
            setTerminalEntries((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                type: "stdout",
                text: payload.data,
              },
            ]);
          } else if (payload.type === "stderr" && payload.data) {
            if (payload.data.includes("sandbox-runner: setgid failed")) {
              eventSource.close();
              eventSourceRef.current = null;
              runDirectCompile();
              return;
            }
            setStderr((prev) => prev + payload.data);
            setProblems((prev) => [...prev, ...parseCompilerDiagnostics(payload.data)]);
            setTerminalEntries((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                type: "stderr",
                text: payload.data,
              },
            ]);
          } else if (payload.type === "exit") {
            const codeNum = payload.code ?? 0;
            const duration = payload.durationMs ?? (Date.now() - startTime);
            setExitCode(codeNum);
            setDurationMs(duration);
            setStatus(codeNum === 0 ? "success" : "error");
            setIsRunning(false);
            activeSessionRef.current = null;
            setActiveSessionId(null);
            setTerminalEntries((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                type: "exit",
                text: `[Process completed with exit code ${codeNum}]`,
                code: codeNum,
                durationMs: duration,
              },
            ]);
            eventSource.close();
            eventSourceRef.current = null;
          }
        } catch {}
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
      };

      // If user had preset fallback input (e.g. from STDIN drawer), feed it into the process
      if (fallbackStdin) {
        setTimeout(() => {
          if (activeSessionRef.current === sessionId) {
            sendInput(fallbackStdin);
          }
        }, 120);
      }
    } catch {
      // Fallback to direct batch compile endpoint
      try {
        const batchRes = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, stdin: fallbackStdin }),
        });
        const batchData = await batchRes.json();
        const duration = batchData.durationMs ?? (Date.now() - startTime);
        setDurationMs(duration);
        if (batchData.success) {
          setStatus("success");
          setExitCode(0);
          const outText = batchData.stdout || "[Program executed with empty output]";
          setStdout(outText);
          setTerminalEntries([
            { id: "out-1", type: "stdout", text: outText },
            { id: "exit-1", type: "exit", text: "[Process completed with exit code 0]", code: 0, durationMs: duration },
          ]);
        } else {
          setStatus("error");
          setExitCode(1);
          const errText = batchData.error || batchData.stderr || "Unknown execution error";
          setStderr(errText);
          setProblems(parseCompilerDiagnostics(errText));
          setTerminalEntries([
            { id: "err-1", type: "stderr", text: errText },
          ]);
        }
      } catch (err) {
        setStatus("error");
        setExitCode(1);
        const msg = err instanceof Error ? err.message : "Compilation error";
        setStderr(msg);
        setTerminalEntries([{ id: "err-sys", type: "stderr", text: msg }]);
      } finally {
        setIsRunning(false);
        activeSessionRef.current = null;
        setActiveSessionId(null);
      }
    }
  }, [killSession, sendInput]);

  return {
    stdout,
    stderr,
    terminalEntries,
    problems,
    isRunning,
    status,
    exitCode,
    durationMs,
    activeSessionId,
    runCode,
    sendInput,
    sendEof,
    killSession,
    clearTerminal,
  };
}

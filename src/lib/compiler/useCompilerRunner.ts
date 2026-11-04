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

export type CompilerStatus =
  | "idle"
  | "compiling"
  | "running"
  | "waiting_input"
  | "completed"
  | "compilation_error"
  | "runtime_error"
  | "timed_out"
  | "terminated"
  | "success"
  | "error";

export interface CompilerRunnerState {
  stdout: string;
  stderr: string;
  terminalEntries: TerminalEntry[];
  problems: CompilerProblem[];
  isRunning: boolean;
  status: CompilerStatus;
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
  const [status, setStatus] = useState<CompilerStatus>("idle");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSessionRef = useRef<string | null>(null);
  const activeTokenRef = useRef<string | null>(null);
  const inputUrlRef = useRef<string | null>(null);
  const killUrlRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTerminal = useCallback(() => {
    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
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

    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }

    // Send kill via WebSocket if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "kill" }));
      } catch {}
    }

    if (killUrl) {
      try {
        await fetch(killUrl, {
          method: "POST",
          headers: token ? { "x-session-token": token } : {},
        });
      } catch {}
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
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
    setStatus("terminated");
    setTerminalEntries((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: "system",
        text: "[Process terminated by user (SIGKILL)]",
      },
    ]);
  }, []);

  const sendInput = useCallback(async (line: string): Promise<boolean> => {
    const sid = activeSessionRef.current;
    const inputUrl = inputUrlRef.current || (sid ? `/api/compiler/session/${sid}/input` : null);
    const token = activeTokenRef.current;
    if (!sid && !inputUrl && !wsRef.current) return false;

    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    setStatus("running");

    // Record user input line in terminal stream
    setTerminalEntries((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: "input",
        text: line,
      },
    ]);

    // Send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "input", data: line }));
        return true;
      } catch {}
    }

    // Fallback to HTTP POST
    if (inputUrl) {
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
    }
    return false;
  }, []);

  const sendEof = useCallback(async (): Promise<boolean> => {
    const sid = activeSessionRef.current;
    const inputUrl = inputUrlRef.current || (sid ? `/api/compiler/session/${sid}/input` : null);
    const token = activeTokenRef.current;

    setTerminalEntries((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: "system",
        text: "^D (EOF sent to stdin)",
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "input", data: "", isEof: true }));
        return true;
      } catch {}
    }

    if (inputUrl) {
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
    }
    return false;
  }, []);

  const runCode = useCallback(async (code: string, fallbackStdin = "") => {
    if (activeSessionRef.current) {
      await killSession();
    }

    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }

    setIsRunning(true);
    setStatus("compiling");
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
        setStatus("compilation_error");
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
      setStatus("running");

      // If we showed the cold-start message, clear it now that the container responded
      if (isSlow) {
        setTerminalEntries([]);
      }

      // 2. Connect via WebSocket (preferred for VS Code-like full bidirectional streaming) or SSE fallback
      const wsUrl = startData.wsUrl as string | null;
      const streamUrl = (startData.streamUrl as string) || `/api/compiler/session/${sessionId}/stream`;

      const handlePayload = (payload: any) => {
        if (!payload) return;
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
          // When program emits output and stays alive, it is awaiting next user input
          if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
          waitingTimerRef.current = setTimeout(() => {
            if (activeSessionRef.current) {
              setStatus("waiting_input");
            }
          }, 250);
        } else if (payload.type === "stderr" && payload.data) {
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
          if (waitingTimerRef.current) {
            clearTimeout(waitingTimerRef.current);
            waitingTimerRef.current = null;
          }
          const codeNum = payload.code ?? 0;
          const duration = payload.durationMs ?? (Date.now() - startTime);
          setExitCode(codeNum);
          setDurationMs(duration);

          const fullErr = ((payload.data || "") + " " + (payload.stderr || "")).toLowerCase();
          if (codeNum === 0) {
            setStatus("completed");
          } else if (fullErr.includes("time limit") || fullErr.includes("timed out")) {
            setStatus("timed_out");
          } else {
            setStatus("runtime_error");
          }

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
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
      };

      const connectSSE = () => {
        if (eventSourceRef.current) return;
        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            handlePayload(JSON.parse(event.data));
          } catch {}
        };

        eventSource.onerror = () => {
          if (eventSource.readyState === EventSource.CLOSED) {
            eventSource.close();
            eventSourceRef.current = null;
          }
        };
      };

      // Connect via WebSocket if available
      if (wsUrl && typeof WebSocket !== "undefined") {
        try {
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onmessage = (event) => {
            try {
              handlePayload(JSON.parse(event.data.toString()));
            } catch {}
          };

          ws.onerror = () => {
            // WebSocket blocked or failed to upgrade, fallback to SSE seamlessly
            if (activeSessionRef.current === sessionId && !eventSourceRef.current) {
              connectSSE();
            }
          };

          ws.onclose = () => {
            if (activeSessionRef.current === sessionId && isRunning && !eventSourceRef.current) {
              connectSSE();
            }
          };
        } catch {
          connectSSE();
        }
      } else {
        connectSSE();
      }

      // If user had preset fallback input (e.g. from STDIN drawer), feed it into the process
      if (fallbackStdin) {
        setTimeout(() => {
          if (activeSessionRef.current === sessionId) {
            sendInput(fallbackStdin);
          }
        }, 120);
      }
    } catch (err: any) {
      clearTimeout(slowTimer);
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      setIsRunning(false);
      setStatus("runtime_error");
      setExitCode(1);
      const errMsg = err?.message || "Execution session connection failed.";
      setStderr(errMsg);
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          type: "stderr",
          text: `[Execution Error] ${errMsg}`,
        },
      ]);
      setDurationMs(Date.now() - startTime);
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

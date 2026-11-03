import { spawn, ChildProcess } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export interface TerminalEvent {
  type: "stdout" | "stderr" | "exit" | "system";
  data?: string;
  code?: number;
  durationMs?: number;
}

export type EventSubscriber = (event: TerminalEvent) => void;

interface ActiveSession {
  id: string;
  child: ChildProcess;
  workDir: string;
  subscribers: Set<EventSubscriber>;
  history: TerminalEvent[];
  status: "running" | "exited";
  startTime: number;
  timer: NodeJS.Timeout;
}

// Global in-memory registry of active compiler sessions shared across Next.js route bundles
const globalForSessions = globalThis as unknown as {
  __codesphere_sessions?: Map<string, ActiveSession>;
};
const sessions =
  globalForSessions.__codesphere_sessions ??
  (globalForSessions.__codesphere_sessions = new Map<string, ActiveSession>());

const UNBUFFER_HEADER = `
#include <stdio.h>
#include <stdlib.h>
__attribute__((constructor)) static void __codesphere_unbuffer() {
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);
}
`;

// Safe sandbox output limits to protect browser from infinite printf crashes
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024; // 5 MB output limit (very generous)
const SESSION_CLEANUP_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours idle cleanup (no short artificial execution limit)

export async function createInteractiveSession(code: string): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
  phase?: "validation" | "compilation" | "system";
}> {
  if (!code || typeof code !== "string") {
    return { success: false, phase: "validation", error: "Source code cannot be empty" };
  }

  const sessionId = randomUUID();
  const workDir = await mkdtemp(join(tmpdir(), `cs-session-${sessionId}-`));
  const sourcePath = join(workDir, "main.c");
  const headerPath = join(workDir, "unbuffer.h");
  const binaryPath = join(workDir, "main");

  await writeFile(sourcePath, code, "utf8");
  await writeFile(headerPath, UNBUFFER_HEADER, "utf8");

  // Compile Phase
  const compileResult = await new Promise<{ exitCode: number | null; stderr: string }>((resolve) => {
    let stderr = "";
    const gcc = spawn("gcc", [
      "-std=c11",
      "-O2",
      "-Wall",
      "-Wextra",
      "-include",
      headerPath,
      sourcePath,
      "-o",
      binaryPath,
      "-lm",
    ], { cwd: workDir });

    gcc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    gcc.on("close", (exitCode: number | null) => {
      resolve({ exitCode, stderr });
    });

    setTimeout(() => {
      try {
        gcc.kill("SIGKILL");
      } catch {}
      resolve({ exitCode: -1, stderr: "Compilation timed out after 10 seconds." });
    }, 10000);
  });

  if (compileResult.exitCode !== 0) {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {}
    return {
      success: false,
      phase: "compilation",
      error: compileResult.stderr || "Compilation failed.",
    };
  }

  // Execution Phase: Spawn process interactively with safety guards
  const startTime = Date.now();
  let totalOutputBytes = 0;

  const child = spawn(binaryPath, [], {
    cwd: workDir,
    env: {
      ...process.env,
      PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
      LANG: "en_US.UTF-8",
    },
  });

  const session: ActiveSession = {
    id: sessionId,
    child,
    workDir,
    subscribers: new Set(),
    history: [],
    status: "running",
    startTime,
    // No artificial time limit on compilation or execution - runs as long as the user wants until stopped
    timer: setTimeout(() => {
      terminateSession(sessionId, "Session cleanup after 2 hours of inactivity.");
    }, SESSION_CLEANUP_TIMEOUT_MS),
  };

  const broadcast = (event: TerminalEvent) => {
    session.history.push(event);
    for (const sub of session.subscribers) {
      try {
        sub(event);
      } catch {}
    }
  };

  child.stdout?.on("data", (chunk: Buffer) => {
    totalOutputBytes += chunk.length;
    if (totalOutputBytes > MAX_OUTPUT_BYTES) {
      terminateSession(
        sessionId,
        "Output Limit Exceeded (>512 KB): Infinite loop or excessive print detected. Terminated to protect system."
      );
      return;
    }
    broadcast({ type: "stdout", data: chunk.toString() });
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    totalOutputBytes += chunk.length;
    if (totalOutputBytes > MAX_OUTPUT_BYTES) {
      terminateSession(
        sessionId,
        "Output Limit Exceeded: Terminated to protect system."
      );
      return;
    }
    broadcast({ type: "stderr", data: chunk.toString() });
  });

  child.on("close", (code: number | null) => {
    if (session.status === "exited") return;
    clearTimeout(session.timer);
    session.status = "exited";
    const durationMs = Date.now() - session.startTime;
    broadcast({ type: "exit", code: code ?? 0, durationMs });

    // Clean up directory and session after 30 seconds
    setTimeout(async () => {
      sessions.delete(sessionId);
      try {
        await rm(workDir, { recursive: true, force: true });
      } catch {}
    }, 30000);
  });

  sessions.set(sessionId, session);

  return {
    success: true,
    sessionId,
  };
}

export function subscribeToSession(sessionId: string, subscriber: EventSubscriber): () => void {
  const session = sessions.get(sessionId);
  if (!session) return () => {};

  // Replay history to late subscriber
  for (const event of session.history) {
    subscriber(event);
  }

  session.subscribers.add(subscriber);
  return () => {
    session.subscribers.delete(subscriber);
  };
}

export function writeSessionInput(sessionId: string, input: string, isEof = false): boolean {
  const session = sessions.get(sessionId);
  if (!session || session.status !== "running" || !session.child.stdin?.writable) {
    return false;
  }

  try {
    if (isEof) {
      session.child.stdin.end();
      return true;
    }
    const toWrite = input.endsWith("\n") ? input : input + "\n";
    session.child.stdin.write(toWrite);
    return true;
  } catch {
    return false;
  }
}

export function closeSessionStdin(sessionId: string): boolean {
  return writeSessionInput(sessionId, "", true);
}

export function terminateSession(sessionId: string, reason?: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;

  clearTimeout(session.timer);

  if (session.status === "running") {
    session.status = "exited";
    try {
      session.child.kill("SIGKILL");
    } catch {}

    const durationMs = Date.now() - session.startTime;
    for (const sub of session.subscribers) {
      try {
        if (reason) {
          sub({ type: "stderr", data: `\n[${reason}]\n` });
        }
        sub({ type: "exit", code: 137, durationMs });
      } catch {}
    }
  }

  sessions.delete(sessionId);
  rm(session.workDir, { recursive: true, force: true }).catch(() => {});
  return true;
}

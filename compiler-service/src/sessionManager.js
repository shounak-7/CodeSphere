import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { getSanitizedChildEnv, signSessionToken } from './security.js';

const UNBUFFER_HEADER = `
#include <stdio.h>
#include <stdlib.h>
__attribute__((constructor)) static void __codesphere_unbuffer() {
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);
}
`;

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024; // 2 MB output buffer limit
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes idle cleanup
const SANDBOX_RUNNER_PATH = '/app/sandbox-runner';

// Active in-memory session store
const sessions = new Map();

/**
 * Compiles and launches a persistent interactive C session.
 *
 * @param {Object} options
 * @param {string} options.code - C source code
 * @param {string} [options.userId] - Authenticated user identifier
 * @param {string} options.secret - Shared COMPILER_API_SECRET for token signing
 * @returns {Promise<Object>}
 */
export async function createSession({ code, userId = 'anonymous', secret }) {
  if (!code || typeof code !== 'string') {
    return { success: false, phase: 'validation', error: 'Source code is required.' };
  }

  if (code.length > 256 * 1024) {
    return { success: false, phase: 'validation', error: 'Source code exceeds maximum allowed size (256 KB).' };
  }

  const sessionId = randomUUID();
  const workDir = await mkdtemp(join(tmpdir(), `cs-sess-${sessionId}-`));
  const sourcePath = join(workDir, 'main.c');
  const headerPath = join(workDir, 'unbuffer.h');
  const binaryPath = join(workDir, 'main');

  await writeFile(sourcePath, code, 'utf8');
  await writeFile(headerPath, UNBUFFER_HEADER, 'utf8');

  // 1. Compile Phase (strict C11, optimizations, math library, warnings)
  const compileResult = await new Promise((resolve) => {
    let stderr = '';
    const gcc = spawn('gcc', [
      '-std=c11',
      '-O2',
      '-Wall',
      '-Wextra',
      '-include',
      headerPath,
      sourcePath,
      '-o',
      binaryPath,
      '-lm',
    ], {
      cwd: workDir,
      env: getSanitizedChildEnv(),
    });

    gcc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    gcc.on('close', (exitCode) => {
      resolve({ exitCode, stderr });
    });

    gcc.on('error', (err) => {
      resolve({ exitCode: -1, stderr: err.message });
    });

    setTimeout(() => {
      try {
        gcc.kill('SIGKILL');
      } catch {}
      resolve({ exitCode: -1, stderr: 'Compilation timed out after 10 seconds.' });
    }, 10000);
  });

  if (compileResult.exitCode !== 0) {
    rm(workDir, { recursive: true, force: true }).catch(() => {});
    return {
      success: false,
      phase: 'compilation',
      error: compileResult.stderr || 'Compilation failed.',
    };
  }

  // 2. Interactive Execution Phase
  const startTime = Date.now();
  let totalOutputBytes = 0;

  // Execute binary directly with sanitized environment & isolated process group
  const command = binaryPath;
  const args = [];

  const child = spawn(command, args, {
    cwd: workDir,
    env: getSanitizedChildEnv(),
    detached: true, // New process group for clean signal dispatching
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const session = {
    id: sessionId,
    userId,
    child,
    workDir,
    subscribers: new Set(),
    history: [],
    status: 'running',
    startTime,
    totalOutputBytes: 0,
    timer: setTimeout(() => {
      terminateSession(sessionId, 'Session terminated due to 30-minute idle limit.');
    }, DEFAULT_SESSION_TTL_MS),
  };

  const broadcast = (event) => {
    session.history.push(event);
    for (const sub of session.subscribers) {
      try {
        sub(event);
      } catch {}
    }
  };

  child.stdout?.on('data', (chunk) => {
    totalOutputBytes += chunk.length;
    if (totalOutputBytes > MAX_OUTPUT_BYTES) {
      terminateSession(
        sessionId,
        'Output Limit Exceeded (>2 MB): Excessive output or infinite loop detected. Terminated for protection.'
      );
      return;
    }
    broadcast({ type: 'stdout', data: chunk.toString('utf8') });
  });

  child.stderr?.on('data', (chunk) => {
    totalOutputBytes += chunk.length;
    if (totalOutputBytes > MAX_OUTPUT_BYTES) {
      terminateSession(sessionId, 'Output Limit Exceeded: Terminated for protection.');
      return;
    }
    broadcast({ type: 'stderr', data: chunk.toString('utf8') });
  });

  child.on('close', (code, signal) => {
    if (session.status === 'exited') return;
    clearTimeout(session.timer);
    session.status = 'exited';
    const durationMs = Date.now() - session.startTime;
    const exitCodeNum = code ?? (signal ? 137 : 0);
    broadcast({ type: 'exit', code: exitCodeNum, durationMs });

    // Clean up filesystem and session state 30 seconds after completion
    setTimeout(async () => {
      sessions.delete(sessionId);
      try {
        await rm(workDir, { recursive: true, force: true });
      } catch {}
    }, 30000);
  });

  child.on('error', (err) => {
    broadcast({ type: 'stderr', data: `Process execution error: ${err.message}\n` });
  });

  sessions.set(sessionId, session);

  const { token, expiresAt } = signSessionToken(sessionId, secret);

  return {
    success: true,
    sessionId,
    token,
    expiresAt,
  };
}

/**
 * Subscribes a listener to a session's streaming events.
 * Immediately replays buffered historical events to late joiners.
 */
export function subscribeToSession(sessionId, subscriber) {
  const session = sessions.get(sessionId);
  if (!session) return () => {};

  for (const event of session.history) {
    subscriber(event);
  }

  session.subscribers.add(subscriber);
  return () => {
    session.subscribers.delete(subscriber);
  };
}

/**
 * Delivers standard input to a running interactive process.
 */
export function writeSessionInput(sessionId, input, isEof = false) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'running' || !session.child?.stdin?.writable) {
    return false;
  }

  try {
    if (isEof) {
      session.child.stdin.end();
      return true;
    }
    const toWrite = input.endsWith('\n') ? input : input + '\n';
    session.child.stdin.write(toWrite);
    return true;
  } catch {
    return false;
  }
}

/**
 * Terminates an active session and kills its entire process group.
 */
export function terminateSession(sessionId, reason) {
  const session = sessions.get(sessionId);
  if (!session) return false;

  clearTimeout(session.timer);

  if (session.status === 'running') {
    session.status = 'exited';
    try {
      // Send SIGKILL to the entire process group if detached, or to child directly
      if (session.child.pid) {
        try {
          process.kill(-session.child.pid, 'SIGKILL');
        } catch {
          session.child.kill('SIGKILL');
        }
      }
    } catch {}

    const durationMs = Date.now() - session.startTime;
    for (const sub of session.subscribers) {
      try {
        if (reason) {
          sub({ type: 'stderr', data: `\n[${reason}]\n` });
        }
        sub({ type: 'exit', code: 137, durationMs });
      } catch {}
    }
  }

  sessions.delete(sessionId);
  rm(session.workDir, { recursive: true, force: true }).catch(() => {});
  return true;
}

export function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

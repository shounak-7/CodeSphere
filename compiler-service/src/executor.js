import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_OUTPUT_BYTES = 512 * 1024; // 512KB output cap to prevent infinite printf flooding
const DEFAULT_TIMEOUT_MS = 30000;     // 30 seconds (no short artificial 4s limit)
const MAX_TIMEOUT_MS = 60000;         // 60 seconds maximum

/**
 * Compiles and runs a C program securely with timeouts, stdin, and resource limits.
 * @param {Object} options
 * @param {string} options.code - C source code
 * @param {string} [options.stdin] - Standard input string
 * @param {number} [options.timeoutMs] - Execution timeout in ms
 * @returns {Promise<ExecutionResult>}
 */
export async function executeCProgram({ code, stdin = '', timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!code || typeof code !== 'string') {
    return {
      success: false,
      phase: 'validation',
      error: 'Source code is required.',
      durationMs: 0,
    };
  }

  if (code.length > 256 * 1024) {
    return {
      success: false,
      phase: 'validation',
      error: 'Source code exceeds maximum allowed size (256 KB).',
      durationMs: 0,
    };
  }

  const effectiveTimeout = Math.min(Math.max(1000, timeoutMs), MAX_TIMEOUT_MS);
  const executionId = randomUUID();
  const workDir = await mkdtemp(join(tmpdir(), `cs-exec-${executionId}-`));
  const sourcePath = join(workDir, 'main.c');
  const binaryPath = join(workDir, 'prog');

  const startTime = Date.now();

  try {
    await writeFile(sourcePath, code, 'utf8');

    // 1. Compilation Phase
    const compileResult = await runProcess({
      command: 'gcc',
      args: ['-std=c11', '-O2', '-Wall', '-Wextra', sourcePath, '-o', binaryPath, '-lm'],
      timeoutMs: 8000,
      cwd: workDir,
    });

    if (compileResult.exitCode !== 0) {
      return {
        success: false,
        phase: 'compilation',
        error: compileResult.stderr || compileResult.stdout || 'Compilation failed.',
        stdout: '',
        stderr: compileResult.stderr,
        exitCode: compileResult.exitCode,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Execution Phase
    const execStartTime = Date.now();
    const execResult = await runProcess({
      command: binaryPath,
      args: [],
      stdin,
      timeoutMs: effectiveTimeout,
      cwd: workDir,
    });

    const executionDuration = Date.now() - execStartTime;

    if (execResult.timedOut) {
      return {
        success: false,
        phase: 'execution',
        error: `Time Limit Exceeded: Process terminated after ${effectiveTimeout / 1000} seconds. Check for infinite loops or waiting for unprovided input.`,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        exitCode: null,
        durationMs: executionDuration,
      };
    }

    return {
      success: execResult.exitCode === 0,
      phase: 'execution',
      error: execResult.exitCode === 0 ? null : (execResult.stderr || `Process exited with code ${execResult.exitCode}`),
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      exitCode: execResult.exitCode,
      durationMs: executionDuration,
    };
  } catch (err) {
    return {
      success: false,
      phase: 'system',
      error: err instanceof Error ? err.message : 'Unknown execution error.',
      durationMs: Date.now() - startTime,
    };
  } finally {
    // Clean up temporary workspace directory
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

/**
 * Spawns an isolated child process with timeout and output buffering.
 */
function runProcess({ command, args, stdin = '', timeoutMs, cwd }) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let resolved = false;

    const child = spawn(command, args, {
      cwd,
      env: {
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        LANG: 'en_US.UTF-8',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {
        // Ignore
      }
    }, timeoutMs);

    if (stdin) {
      try {
        child.stdin.write(stdin);
        child.stdin.end();
      } catch {
        // Child might have exited prematurely
      }
    } else {
      try {
        child.stdin.end();
      } catch {
        // Ignore
      }
    }

    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += chunk.toString('utf8');
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += chunk.toString('utf8');
      }
    });

    child.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({
          exitCode: -1,
          stdout,
          stderr: err.message,
          timedOut: false,
        });
      }
    });

    child.on('close', (code, signal) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({
          exitCode: code ?? (signal ? -1 : 0),
          stdout,
          stderr,
          timedOut,
        });
      }
    });
  });
}

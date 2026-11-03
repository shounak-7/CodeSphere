import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession,
  subscribeToSession,
  writeSessionInput,
  terminateSession,
  getSession,
} from '../src/sessionManager.js';
import { signSessionToken, verifySessionToken } from '../src/security.js';

const TEST_SECRET = 'test-compiler-secret-key-32-bytes-long!';

test('1. Security: HMAC Token signing and verification', () => {
  const sessionId = 'test-session-1234';
  const { token, expiresAt } = signSessionToken(sessionId, TEST_SECRET, 5000);

  assert.ok(token);
  assert.ok(expiresAt > Date.now());

  // Valid verification
  const isValid = verifySessionToken(sessionId, token, TEST_SECRET);
  assert.equal(isValid, true);

  // Invalid session ID mismatch
  assert.equal(verifySessionToken('wrong-session-id', token, TEST_SECRET), false);

  // Tampered signature
  assert.equal(verifySessionToken(sessionId, token + 'bad', TEST_SECRET), false);

  // Wrong secret
  assert.equal(verifySessionToken(sessionId, token, 'different-secret'), false);
});

test('2. Interactive Session: Hello World with incremental output', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      printf("Stream Part 1\\n");
      printf("Stream Part 2\\n");
      return 0;
    }
  `;

  const result = await createSession({ code, secret: TEST_SECRET });
  assert.equal(result.success, true);
  assert.ok(result.sessionId);
  assert.ok(result.token);

  const outputs = [];
  let exited = false;

  await new Promise((resolve) => {
    subscribeToSession(result.sessionId, (event) => {
      if (event.type === 'stdout') {
        outputs.push(event.data);
      }
      if (event.type === 'exit') {
        exited = true;
        assert.equal(event.code, 0);
        resolve();
      }
    });
  });

  const fullOutput = outputs.join('');
  assert.match(fullOutput, /Stream Part 1/);
  assert.match(fullOutput, /Stream Part 2/);
  assert.equal(exited, true);
});

test('3. Interactive Session: scanf() with multiple successive inputs', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      int a, b;
      printf("Enter first: ");
      if (scanf("%d", &a) != 1) return 1;
      printf("Got %d\\nEnter second: ", a);
      if (scanf("%d", &b) != 1) return 2;
      printf("Result: %d\\n", a * b);
      return 0;
    }
  `;

  const result = await createSession({ code, secret: TEST_SECRET });
  assert.equal(result.success, true);

  const outputs = [];
  let exitCode = null;

  await new Promise((resolve) => {
    subscribeToSession(result.sessionId, (event) => {
      if (event.type === 'stdout') {
        outputs.push(event.data);
        const combined = outputs.join('');

        if (combined.includes('Enter first:') && !combined.includes('Got 7')) {
          writeSessionInput(result.sessionId, '7');
        } else if (combined.includes('Enter second:') && !combined.includes('Result: 42')) {
          writeSessionInput(result.sessionId, '6');
        }
      }
      if (event.type === 'exit') {
        exitCode = event.code;
        resolve();
      }
    });
  });

  const fullOutput = outputs.join('');
  assert.match(fullOutput, /Got 7/);
  assert.match(fullOutput, /Result: 42/);
  assert.equal(exitCode, 0);
});

test('4. Interactive Session: Immediate process termination (Stop / SIGKILL)', async () => {
  const code = `
    #include <stdio.h>
    #include <unistd.h>
    int main() {
      printf("Started infinite loop...\\n");
      while (1) {
        sleep(1);
      }
      return 0;
    }
  `;

  const result = await createSession({ code, secret: TEST_SECRET });
  assert.equal(result.success, true);

  let started = false;
  let exitCode = null;

  await new Promise((resolve) => {
    subscribeToSession(result.sessionId, (event) => {
      if (event.type === 'stdout' && event.data.includes('Started infinite loop')) {
        started = true;
        // Trigger immediate termination
        terminateSession(result.sessionId, 'User clicked Stop');
      }
      if (event.type === 'exit') {
        exitCode = event.code;
        resolve();
      }
    });
  });

  assert.equal(started, true);
  assert.equal(exitCode, 137); // Killed via SIGKILL (128 + 9)
  assert.equal(getSession(result.sessionId), null); // Cleaned up
});

test('5. Multi-User Isolation: Concurrent sessions do not cross-talk', async () => {
  const code1 = `
    #include <stdio.h>
    int main() {
      int x;
      scanf("%d", &x);
      printf("User1: %d\\n", x * 10);
      return 0;
    }
  `;

  const code2 = `
    #include <stdio.h>
    int main() {
      int y;
      scanf("%d", &y);
      printf("User2: %d\\n", y * 100);
      return 0;
    }
  `;

  const session1 = await createSession({ code: code1, userId: 'user-1', secret: TEST_SECRET });
  const session2 = await createSession({ code: code2, userId: 'user-2', secret: TEST_SECRET });

  assert.notEqual(session1.sessionId, session2.sessionId);

  const out1 = [];
  const out2 = [];

  const p1 = new Promise((resolve) => {
    subscribeToSession(session1.sessionId, (e) => {
      if (e.type === 'stdout') out1.push(e.data);
      if (e.type === 'exit') resolve();
    });
  });

  const p2 = new Promise((resolve) => {
    subscribeToSession(session2.sessionId, (e) => {
      if (e.type === 'stdout') out2.push(e.data);
      if (e.type === 'exit') resolve();
    });
  });

  // Feed distinct inputs to respective sessions
  writeSessionInput(session1.sessionId, '5');
  writeSessionInput(session2.sessionId, '9');

  await Promise.all([p1, p2]);

  assert.match(out1.join(''), /User1: 50/);
  assert.doesNotMatch(out1.join(''), /User2/);

  assert.match(out2.join(''), /User2: 900/);
  assert.doesNotMatch(out2.join(''), /User1/);
});

test('6. Compilation error diagnostics reporting', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      syntax_error_undefined_variable = 100
      return 0;
    }
  `;

  const result = await createSession({ code, secret: TEST_SECRET });
  assert.equal(result.success, false);
  assert.equal(result.phase, 'compilation');
  assert.match(result.error, /syntax_error_undefined_variable/);
});

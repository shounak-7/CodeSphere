import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createServer } from 'node:http';
import { createSession } from '../src/sessionManager.js';

test('WebSocket Interactive Session: incremental scanf over ws frame', async () => {
  const code = `#include <stdio.h>
int main() {
    int x;
    printf("Number: ");
    scanf("%d", &x);
    printf("Result = %d\\n", x * 2);
    return 0;
}
`;

  const secret = 'cs_sec_test';
  const session = await createSession({ code, secret });
  assert.equal(session.success, true);

  // We know the session works in-process
  assert.ok(session.sessionId);
  assert.ok(session.token);
});

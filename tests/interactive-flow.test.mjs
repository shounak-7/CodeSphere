import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInteractiveSession, writeSessionInput, subscribeToSession } from '../src/lib/compiler/sessionManager.ts';

test('True Interactive C Execution (VS Code-Style): Step-by-Step scanf()', async () => {
  const code = `#include <stdio.h>

int main() {
    int a, b;

    printf("Enter first number: ");
    scanf("%d", &a);

    printf("Enter second number: ");
    scanf("%d", &b);

    printf("Sum = %d\\n", a + b);

    return 0;
}
`;

  const session = await createInteractiveSession(code);
  assert.equal(session.success, true, `Session creation failed: ${session.error}`);
  assert.ok(session.sessionId);

  const sessionId = session.sessionId;
  const events = [];

  const streamPromise = new Promise((resolve, reject) => {
    let outputSoFar = '';
    let stage = 0;

    const unsubscribe = subscribeToSession(sessionId, (evt) => {
      events.push(evt);

      if (evt.type === 'stdout' && evt.data) {
        outputSoFar += evt.data;

        // Stage 0: Waiting for "Enter first number: "
        if (stage === 0 && outputSoFar.includes('Enter first number: ')) {
          stage = 1;
          setTimeout(() => {
            writeSessionInput(sessionId, '10\n');
          }, 50);
        }

        // Stage 1: Waiting for "Enter second number: "
        if (stage === 1 && outputSoFar.includes('Enter second number: ')) {
          stage = 2;
          setTimeout(() => {
            writeSessionInput(sessionId, '20\n');
          }, 50);
        }
      }

      if (evt.type === 'exit') {
        unsubscribe();
        if (evt.code === 0 && outputSoFar.includes('Sum = 30')) {
          resolve(outputSoFar);
        } else {
          reject(new Error(`Program exited code ${evt.code}, final output: ${outputSoFar}`));
        }
      }
    });
  });

  const finalOutput = await streamPromise;
  assert.match(finalOutput, /Enter first number: /);
  assert.match(finalOutput, /Enter second number: /);
  assert.match(finalOutput, /Sum = 30/);
  console.log("Interactive Execution Success Output:\n" + finalOutput);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const COMPILER_URL = 'http://localhost:4000';
const SECRET = 'cs_sec_26a3c606d98b18517f988f5f5d3e0161e77e4e556109d369d393e7d3173c3e8d';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, COMPILER_URL);
    const reqHeaders = { ...headers };
    let postData = null;

    if (body !== null) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => {
          resData += chunk.toString('utf8');
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(resData);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, raw: resData, json });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

test('HTTP 1: /health endpoint returns 200 OK', async () => {
  const res = await request('GET', '/health');
  assert.equal(res.status, 200);
  assert.equal(res.json?.status, 'ok');
  assert.match(res.json?.service, /CodeSphere/);
});

test('HTTP 2: /compile with invalid secret is rejected (401)', async () => {
  const res = await request('POST', '/compile', { code: 'int main(){return 0;}' }, { 'x-compiler-secret': 'wrong' });
  assert.equal(res.status, 401);
});

test('HTTP 3: /compile with valid secret executes batch C code', async () => {
  const code = '#include <stdio.h>\nint main() { printf("Batch Works!\\n"); return 0; }';
  const res = await request('POST', '/compile', { code }, { 'x-compiler-secret': SECRET });
  assert.equal(res.status, 200);
  assert.equal(res.json?.success, true);
  assert.match(res.json?.stdout, /Batch Works!/);
});

test('HTTP 4: Full Interactive Flow: POST /session -> SSE stream -> POST /input -> Exit', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      int val;
      printf("PROMPT_READY\\n");
      if (scanf("%d", &val) == 1) {
        printf("SQUARED: %d\\n", val * val);
      }
      return 0;
    }
  `;

  // 1. Create interactive session
  const sessRes = await request('POST', '/session', { code, userId: 'test-user' }, { 'x-compiler-secret': SECRET });
  assert.equal(sessRes.status, 200);
  assert.equal(sessRes.json?.success, true);
  const { sessionId, token } = sessRes.json;
  assert.ok(sessionId);
  assert.ok(token);

  // 2. Connect to SSE stream via HTTP with query token
  const receivedLines = [];
  let exitReceived = false;

  await new Promise((resolve, reject) => {
    const url = new URL(`/session/${sessionId}/stream?token=${encodeURIComponent(token)}`, COMPILER_URL);
    const req = http.request(url, (res) => {
      assert.equal(res.statusCode, 200);
      assert.match(res.headers['content-type'], /text\/event-stream/);

      res.on('data', async (chunk) => {
        const text = chunk.toString('utf8');
        receivedLines.push(text);

        if (text.includes('PROMPT_READY')) {
          // 3. Send stdin live input
          const inputRes = await request(
            'POST',
            `/session/${sessionId}/input`,
            { input: '9' },
            { 'x-session-token': token }
          );
          assert.equal(inputRes.status, 200);
          assert.equal(inputRes.json?.success, true);
        }

        if (text.includes('"type":"exit"')) {
          exitReceived = true;
          req.destroy();
          resolve();
        }
      });
    });

    req.on('error', (err) => {
      if (!exitReceived) reject(err);
    });

    req.end();
  });

  const fullStream = receivedLines.join('');
  assert.match(fullStream, /PROMPT_READY/);
  assert.match(fullStream, /SQUARED: 81/);
  assert.equal(exitReceived, true);
});

test('HTTP 5: POST /session/:id/kill immediately terminates running process', async () => {
  const code = '#include <stdio.h>\n#include <unistd.h>\nint main() { while(1) { sleep(1); } return 0; }';

  const sessRes = await request('POST', '/session', { code }, { 'x-compiler-secret': SECRET });
  const { sessionId, token } = sessRes.json;

  // Kill via HTTP
  const killRes = await request('POST', `/session/${sessionId}/kill`, {}, { 'x-session-token': token });
  assert.equal(killRes.status, 200);
  assert.equal(killRes.json?.success, true);
});

test('HTTP 6: Invalid token for stream/input/kill is rejected with 401', async () => {
  const sessRes = await request('POST', '/session', { code: 'int main(){return 0;}' }, { 'x-compiler-secret': SECRET });
  const { sessionId } = sessRes.json;

  const badStream = await request('GET', `/session/${sessionId}/stream?token=invalid.token`);
  assert.equal(badStream.status, 401);

  const badInput = await request('POST', `/session/${sessionId}/input`, { input: 'hello' }, { 'x-session-token': 'invalid.token' });
  assert.equal(badInput.status, 401);

  const badKill = await request('POST', `/session/${sessionId}/kill`, {}, { 'x-session-token': 'invalid.token' });
  assert.equal(badKill.status, 401);
});

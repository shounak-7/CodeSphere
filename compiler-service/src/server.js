import { createServer } from 'node:http';
import { executeCProgram } from './executor.js';
import {
  createSession,
  subscribeToSession,
  writeSessionInput,
  terminateSession,
  getSession,
} from './sessionManager.js';
import { verifySessionToken } from './security.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const COMPILER_API_SECRET =
  process.env.COMPILER_API_SECRET || 'cs_sec_26a3c606d98b18517f988f5f5d3e0161e77e4e556109d369d393e7d3173c3e8d';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-compiler-secret, x-session-token'
  );
}

function parseJsonBody(req, maxBytes = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function verifyAuth(req, sessionId = null, queryToken = null) {
  const secretHeader = req.headers['x-compiler-secret'];
  if (secretHeader && secretHeader === COMPILER_API_SECRET) {
    return true; // Authorized via master server secret
  }

  // Check session token
  const tokenHeader = req.headers['x-session-token'];
  const token = tokenHeader || queryToken;

  if (sessionId && token) {
    return verifySessionToken(sessionId, token, COMPILER_API_SECRET);
  }

  return false;
}

const server = createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. Health check
  if (req.method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'CodeSphere Interactive GCC Compiler Engine',
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // 2. Backward-compatible batch compilation endpoint
  if (req.method === 'POST' && pathname === '/compile') {
    if (!verifyAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid compiler secret.' }));
      return;
    }

    try {
      const payload = await parseJsonBody(req);
      const { code, stdin, timeoutMs } = payload;
      const result = await executeCProgram({ code, stdin, timeoutMs });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. POST /session — Start a new interactive session
  if (req.method === 'POST' && pathname === '/session') {
    if (!verifyAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Master secret required to initiate sessions.' }));
      return;
    }

    try {
      const payload = await parseJsonBody(req);
      const { code, userId } = payload;
      const result = await createSession({
        code,
        userId: userId || 'anonymous',
        secret: COMPILER_API_SECRET,
      });

      if (!result.success) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Session routes matching: /session/:id/(stream|input|kill)
  const sessionMatch = pathname.match(/^\/session\/([a-zA-Z0-9_-]+)(?:\/(stream|input|kill))?$/);

  if (sessionMatch) {
    const sessionId = sessionMatch[1];
    const action = sessionMatch[2];
    const queryToken = url.searchParams.get('token');

    // 4. GET /session/:id/stream — SSE Stream
    if (req.method === 'GET' && action === 'stream') {
      if (!verifyAuth(req, sessionId, queryToken)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized or expired session token.' }));
        return;
      }

      const session = getSession(sessionId);
      if (!session) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found or already expired.' }));
        return;
      }

      // Establish Server-Sent Events headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Send initial comment to establish stream immediately
      res.write(': keep-alive\n\n');

      const unsubscribe = subscribeToSession(sessionId, (event) => {
        try {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          if (event.type === 'exit') {
            setTimeout(() => {
              try {
                res.end();
              } catch {}
            }, 100);
          }
        } catch {
          // Client disconnected
        }
      });

      // Keep connection warm with heartbeats every 15s to bypass intermediate proxy timeouts
      const heartbeat = setInterval(() => {
        try {
          res.write(': ping\n\n');
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.on('close', () => {
        clearInterval(heartbeat);
        unsubscribe();
      });

      return;
    }

    // 5. POST /session/:id/input — Send live stdin
    if (req.method === 'POST' && action === 'input') {
      if (!verifyAuth(req, sessionId, queryToken)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized or expired session token.' }));
        return;
      }

      try {
        const payload = await parseJsonBody(req);
        const { input, isEof } = payload;
        const ok = writeSessionInput(sessionId, input ?? '', Boolean(isEof));

        if (!ok) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Session not active or stdin closed.' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // 6. POST /session/:id/kill — Terminate process immediately
    if (req.method === 'POST' && action === 'kill') {
      if (!verifyAuth(req, sessionId, queryToken)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized or expired session token.' }));
        return;
      }

      const ok = terminateSession(sessionId, 'Process terminated by user request.');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: ok }));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[CodeSphere Engine] Listening on http://0.0.0.0:${PORT}`);
});

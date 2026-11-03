import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const DEFAULT_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Creates a cryptographically signed, short-lived session token.
 * Token payload: "<expiresAt>.<signature>"
 * Signature is computed over: `${sessionId}:${expiresAt}` using the compiler secret.
 *
 * @param {string} sessionId - Unique UUID of the execution session
 * @param {string} secret - Shared COMPILER_API_SECRET
 * @param {number} [ttlMs] - Time to live in milliseconds
 * @returns {{ token: string, expiresAt: number }}
 */
export function signSessionToken(sessionId, secret, ttlMs = DEFAULT_TOKEN_TTL_MS) {
  const expiresAt = Date.now() + ttlMs;
  const hmac = createHmac('sha256', secret);
  hmac.update(`${sessionId}:${expiresAt}`);
  const signature = hmac.digest('hex');
  const token = `${expiresAt}.${signature}`;
  return { token, expiresAt };
}

/**
 * Verifies that a session token is valid, unexpired, and authentic for the given sessionId.
 *
 * @param {string} sessionId - Session to verify
 * @param {string} token - Token passed by client
 * @param {string} secret - Shared COMPILER_API_SECRET
 * @returns {boolean}
 */
export function verifySessionToken(sessionId, token, secret) {
  if (!sessionId || !token || !secret || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false; // Expired token
  }

  const hmac = createHmac('sha256', secret);
  hmac.update(`${sessionId}:${expiresAt}`);
  const expectedSignature = hmac.digest('hex');

  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expectedSignature, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Sanitizes the environment variables to ensure zero secret leakage to child C processes.
 *
 * @returns {Record<string, string>}
 */
export function getSanitizedChildEnv() {
  return {
    PATH: '/usr/local/bin:/usr/bin:/bin',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
    TMPDIR: '/tmp',
    HOME: '/tmp',
  };
}

'use client';

import crypto from 'crypto';

const CSRF_SECRET = process.env.AUTH_SECRET || 'default-csrf-secret';
const CSRF_EXPIRY = 3600000; // 1 hour

interface CSRFToken {
  token: string;
  expires: number;
}

const tokenStore = new Map<string, CSRFToken>();

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  tokenStore.set(sessionId, {
    token,
    expires: Date.now() + CSRF_EXPIRY,
  });
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = tokenStore.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    tokenStore.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

export function getCSRFHeaders(sessionId: string): Record<string, string> {
  const token = generateCSRFToken(sessionId);
  return {
    'X-CSRF-Token': token,
    'X-CSRF-Expires': Math.ceil((Date.now() + CSRF_EXPIRY) / 1000).toString(),
  };
}

// Cleanup expired tokens
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, token] of tokenStore.entries()) {
      if (now > token.expires) {
        tokenStore.delete(key);
      }
    }
  }, 60000);
}

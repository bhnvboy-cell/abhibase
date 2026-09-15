'use client';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const DEFAULT_LIMITS = {
  api: { requests: 100, windowMs: 60000 }, // 100 requests per minute
  ai: { requests: 20, windowMs: 60000 },   // 20 AI requests per minute
  auth: { requests: 10, windowMs: 300000 }, // 10 auth attempts per 5 minutes
  upload: { requests: 20, windowMs: 60000 }, // 20 uploads per minute
};

type RateLimitType = keyof typeof DEFAULT_LIMITS;

export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${type}:${identifier}`;
  const limit = DEFAULT_LIMITS[type];
  const now = Date.now();
  
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + limit.windowMs });
    return { allowed: true, remaining: limit.requests - 1, resetTime: now + limit.windowMs };
  }
  
  if (record.count >= limit.requests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: limit.requests - record.count, resetTime: record.resetTime };
}

export function getRateLimitHeaders(
  result: ReturnType<typeof checkRateLimit>
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Limited': result.allowed ? 'false' : 'true',
  };
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}

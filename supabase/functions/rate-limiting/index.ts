interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests = new Map<string, number[]>();
  constructor(private windowMs: number, private maxRequests: number) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let timestamps = this.requests.get(identifier) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);
    if (timestamps.length >= this.maxRequests) return false;
    timestamps.push(now);
    this.requests.set(identifier, timestamps);
    return true;
  }

  getRemaining(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let timestamps = this.requests.get(identifier) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);
    return Math.max(0, this.maxRequests - timestamps.length);
  }
}

export const limiters = {
  initiateCall: new RateLimiter(60000, 10),
  deductBill: new RateLimiter(60000, 60),
  paymentOrder: new RateLimiter(60000, 5),
  payout: new RateLimiter(3600000, 10),
  agoraToken: new RateLimiter(60000, 100),
  refund: new RateLimiter(60000, 10),
};

export function checkRateLimit(limiter: RateLimiter, identifier: string): Response | null {
  if (!limiter.isAllowed(identifier)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 60 }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }
  return null;
}

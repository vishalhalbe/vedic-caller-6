import { createAuditLog } from '../_shared/audit-logging.ts';
import { validateBody, validateSeconds, validateAmount } from '../_shared/validation.ts';
import { checkRateLimit, limiters } from '../_shared/rate-limiting.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const log = (level: string, message: string, data?: object) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, message, ...data }));
};

class CircuitBreaker {
  private failures = 0;
  private lastFailure: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 5;
  private readonly timeout = 30000;

  recordSuccess() { this.failures = 0; this.state = 'closed'; }

  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
      log('WARN', 'Circuit breaker opened', { failures: this.failures });
    }
  }

  isClosed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open' && this.lastFailure && Date.now() - this.lastFailure > this.timeout) {
      this.state = 'half-open';
      log('INFO', 'Circuit breaker half-open');
      return true;
    }
    return false;
  }

  getState(): string { return this.state; }
}

const billingCircuitBreaker = new CircuitBreaker();

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await operation(); }
    catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        log('WARN', 'Operation failed, retrying', { attempt, error: (error as Error).message });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

interface RequestBody {
  call_id: string;
  seconds: number;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  log('INFO', 'Deduct call bill request', { requestId });

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (!billingCircuitBreaker.isClosed()) {
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable', circuit_breaker: billingCircuitBreaker.getState() }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { call_id, seconds } = body;
    const validationErrors = validateBody(body, ['call_id', 'seconds']);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: validationErrors.map(e => e.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('INFO', 'Processing deduction', { requestId, call_id, seconds });

    const callRes = await withRetry(() =>
      fetch(
        `${supabaseUrl}/rest/v1/calls?id=eq.${call_id}&select=*,astrologers!calls_astrologer_call_id_fkey(price_per_minute)`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      ).then(r => r.json())
    );

    const calls = Array.isArray(callRes) ? callRes : [callRes];
    if (!calls || calls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Call not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const call = calls[0];
    const ratePerSecond = call.astrologers?.price_per_minute ? call.astrologers.price_per_minute / 60 : 0.1667;
    const amountToDeduct = seconds * ratePerSecond;

    log('INFO', 'Call details', { requestId, callId: call.id, ratePerSecond, amountToDeduct });

    const walletRes = await withRetry(() =>
      fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${call.customer_id}&select=*`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      ).then(r => r.json())
    );

    const wallets = Array.isArray(walletRes) ? walletRes : [walletRes];
    if (!wallets || wallets.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const wallet = wallets[0];
    const totalBalance = Number(wallet.balance) + Number(wallet.bonus_balance || 0);

    if (totalBalance < amountToDeduct) {
      log('WARN', 'Insufficient balance, ending call', { requestId, required: amountToDeduct, available: totalBalance });

      await fetch(
        `${supabaseUrl}/rest/v1/calls?id=eq.${call_id}`,
        {
          method: 'PATCH',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ended', end_reason: 'insufficient_balance' })
        }
      );

      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient balance', should_end_call: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const amountFromBalance = Math.min(amountToDeduct, Number(wallet.balance));
    const amountFromBonus = amountToDeduct - amountFromBalance;
    const newBalance = Number((Number(wallet.balance) - amountFromBalance).toFixed(2));
    const newBonusBalance = Number((Math.max(0, Number(wallet.bonus_balance || 0) - amountFromBonus)).toFixed(2));
    const totalSpent = Number((Number(wallet.total_spent || 0) + amountToDeduct).toFixed(2));

    await withRetry(() =>
      fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${call.customer_id}`,
        {
          method: 'PATCH',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ balance: newBalance, bonus_balance: newBonusBalance, total_spent: totalSpent })
        }
      ).then(r => { billingCircuitBreaker.recordSuccess(); return r; })
    );

    await fetch(
      `${supabaseUrl}/rest/v1/transactions`,
      {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: wallet.id,
          type: 'call_deduction',
          amount: Number(amountToDeduct.toFixed(2)),
          status: 'completed',
          balance_before: totalBalance,
          balance_after: newBalance + newBonusBalance,
          reference_id: call_id,
          reference_type: 'call'
        })
      }
    );

    await createAuditLog(supabaseUrl, supabaseKey, {
      actor_id: call.customer_id,
      actor_type: 'user',
      event_type: 'call_ended',
      resource_type: 'call',
      resource_id: call_id,
      action: 'update',
      status: 'success',
      metadata: { deducted: amountToDeduct, seconds, balance_after: newBalance + newBonusBalance }
    });

    const isLowBalance = (newBalance + newBonusBalance) < 5;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          deducted_amount: amountToDeduct,
          balance_after: newBalance + newBonusBalance,
          is_low_balance: isLowBalance,
          should_end_call: (newBalance + newBonusBalance) <= 0
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    billingCircuitBreaker.recordFailure();
    log('ERROR', 'Error processing deduction', { requestId, error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

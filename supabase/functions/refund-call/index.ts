import { limiters, checkRateLimit } from '../_shared/rate-limiting.ts';
import { createAuditLog } from '../_shared/audit-logging.ts';
import { validateBody } from '../_shared/validation.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const log = (level: string, message: string, data?: object) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, message, ...data }));
};

interface RequestBody {
  call_id: string;
  reason: string;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  log('INFO', 'Refund request', { requestId });

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
    const rateLimitCheck = checkRateLimit(limiters.refund, requestId);
    if (rateLimitCheck) return rateLimitCheck;

    const body: RequestBody = await req.json();
    const { call_id, reason } = body;

    const validationErrors = validateBody(body, ['call_id']);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: validationErrors.map(e => e.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('INFO', 'Processing refund', { requestId, call_id, reason });

    const callRes = await fetch(
      `${supabaseUrl}/rest/v1/calls?id=eq.${call_id}&select=*`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const calls = await callRes.json();

    if (!calls || calls.length === 0) {
      log('WARN', 'Call not found', { requestId, call_id });
      return new Response(
        JSON.stringify({ error: 'Call not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const call = calls[0];

    if (call.status !== 'failed' && call.status !== 'ended') {
      log('WARN', 'Call not eligible for refund', { requestId, status: call.status });
      return new Response(
        JSON.stringify({ error: 'Call not eligible for refund' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const refundCheck = await fetch(
      `${supabaseUrl}/rest/v1/transactions?reference_id=eq.${call_id}&reference_type=eq.call_refund&limit=1`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const existingRefunds = await refundCheck.json();
    if (existingRefunds && existingRefunds.length > 0) {
      log('INFO', 'Already refunded', { requestId, call_id });
      return new Response(
        JSON.stringify({ error: 'Already refunded' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const walletRes = await fetch(
      `${supabaseUrl}/rest/v1/wallets?user_id=eq.${call.customer_id}&select=*`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const wallets = await walletRes.json();

    if (!wallets || wallets.length === 0) {
      log('WARN', 'Wallet not found', { requestId });
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const wallet = wallets[0];
    const refundAmount = call.total_cost || 0;

    if (refundAmount <= 0) {
      log('INFO', 'No refund needed', { requestId });
      return new Response(
        JSON.stringify({ success: true, message: 'No refund needed' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newBalance = Number((Number(wallet.balance) + refundAmount).toFixed(2));

    await fetch(
      `${supabaseUrl}/rest/v1/wallets?user_id=eq.${call.customer_id}`,
      {
        method: 'PATCH',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: newBalance })
      }
    );

    await fetch(
      `${supabaseUrl}/rest/v1/transactions`,
      {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: wallet.id,
          type: 'refund',
          amount: Number(refundAmount.toFixed(2)),
          status: 'completed',
          balance_before: Number(wallet.balance),
          balance_after: newBalance,
          description: `Refund for failed call: ${reason || 'technical_issue'}`,
          reference_id: call_id,
          reference_type: 'call_refund'
        })
      }
    );

    await createAuditLog(supabaseUrl, supabaseKey, {
      actor_id: call.customer_id,
      actor_type: 'user',
      event_type: 'call_refunded',
      resource_type: 'call',
      resource_id: call_id,
      action: 'update',
      status: 'success',
      metadata: { refund_amount: refundAmount, reason }
    });

    log('INFO', 'Refund processed', { requestId, call_id, refundAmount, newBalance });

    return new Response(
      JSON.stringify({
        success: true,
        data: { refund_amount: refundAmount, new_balance: newBalance }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log('ERROR', 'Error processing refund', { requestId, error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

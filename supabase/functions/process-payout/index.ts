import { validateBody } from '../_shared/validation.ts';
import { getAuthToken, createAuthError, verifyToken } from '../_shared/auth.ts';
import { checkRateLimit, limiters } from '../_shared/rate-limiting.ts';
import { createAuditLog } from '../_shared/audit-logging.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RequestBody {
  astrologer_id: string;
  amount: number;
}

Deno.serve(async (req) => {
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
    const authToken = getAuthToken(req);
    if (!authToken) return createAuthError();
    const user = await verifyToken(authToken, supabaseUrl);
    if (!user) return createAuthError('Invalid token');

    const body: RequestBody = await req.json();
    const validationErrors = validateBody(body, ['astrologer_id', 'amount']);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: validationErrors.map(e => e.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { astrologer_id, amount } = body;

    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/commission_settings?order=created_at.desc&limit=1&select=*`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const settings = await settingsRes.json();
    const config = settings?.[0] || {};
    const commissionRate = Number(config.commission_rate) || 0.20;
    const minWithdrawal = Number(config.min_withdrawal) || 500;

    if (amount < minWithdrawal) {
      return new Response(
        JSON.stringify({ error: `Minimum withdrawal amount is ₹${minWithdrawal}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rateLimitCheck = checkRateLimit(limiters.payout, astrologer_id);
    if (rateLimitCheck) return rateLimitCheck;

    const walletRes = await fetch(
      `${supabaseUrl}/rest/v1/wallets?user_id=eq.${astrologer_id}&select=*`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const wallets = await walletRes.json();

    if (!wallets || wallets.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const wallet = wallets[0];
    const availableBalance = Number(wallet.balance);

    if (availableBalance < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const platformFee = amount * commissionRate;
    const payoutAmount = amount - platformFee;

    const payoutRes = await fetch(
      `${supabaseUrl}/rest/v1/withdrawals`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: astrologer_id,
          amount: Number(payoutAmount.toFixed(2)),
          status: 'pending',
          payment_method: 'bank_transfer'
        })
      }
    );
    const payout = await payoutRes.json();
    const payoutRecord = Array.isArray(payout) ? payout[0] : payout;

    await fetch(
      `${supabaseUrl}/rest/v1/wallets?user_id=eq.${astrologer_id}`,
      {
        method: 'PATCH',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: Number((availableBalance - amount).toFixed(2)) })
      }
    );

    await fetch(
      `${supabaseUrl}/rest/v1/transactions`,
      {
        method: 'POST',
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_id: wallet.id,
          type: 'withdrawal',
          amount: Number(amount.toFixed(2)),
          status: 'pending',
          balance_before: availableBalance,
          balance_after: Number((availableBalance - amount).toFixed(2)),
          reference_id: payoutRecord?.id,
          reference_type: 'withdrawal',
          description: `Withdrawal of ₹${amount} (fee: ₹${platformFee.toFixed(2)})`
        })
      }
    );

    await createAuditLog(supabaseUrl, supabaseKey, {
      actor_id: user.sub || astrologer_id,
      actor_type: 'user',
      event_type: 'payout_requested',
      resource_type: 'withdrawal',
      resource_id: payoutRecord?.id || 'unknown',
      action: 'create',
      status: 'success',
      metadata: { amount, payoutAmount, platformFee, astrologer_id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          payout_id: payoutRecord?.id,
          amount_requested: amount,
          payout_amount: payoutAmount,
          platform_fee: platformFee,
          status: 'pending'
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

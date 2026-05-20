import { getAuthToken, createAuthError, verifyToken } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit-logging.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

interface RequestBody {
  withdrawal_id: string;
  action: 'approve' | 'reject';
  admin_note?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    });
  }

  try {
    const authToken = getAuthToken(req);
    if (!authToken) return createAuthError();
    const user = await verifyToken(authToken, supabaseUrl);
    if (!user) return createAuthError('Invalid token');

    const adminRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${user.sub}&select=role&limit=1`,
      { headers }
    );
    const adminUsers = await adminRes.json();
    const adminUser = adminUsers?.[0];
    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { withdrawal_id, action, admin_note }: RequestBody = await req.json();
    if (!withdrawal_id || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'withdrawal_id and action (approve|reject) are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const withdrawalRes = await fetch(
      `${supabaseUrl}/rest/v1/withdrawals?id=eq.${withdrawal_id}&select=*`,
      { headers }
    );
    const withdrawals = await withdrawalRes.json();
    const withdrawal = withdrawals?.[0];

    if (!withdrawal) {
      return new Response(
        JSON.stringify({ error: 'Withdrawal request not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (withdrawal.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Withdrawal already ${withdrawal.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    if (action === 'reject') {
      const walletRes = await fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${withdrawal.user_id}&select=*`,
        { headers }
      );
      const wallets = await walletRes.json();
      const wallet = wallets?.[0];

      if (wallet) {
        await fetch(
          `${supabaseUrl}/rest/v1/wallets?id=eq.${wallet.id}`,
          {
            method: 'PATCH', headers,
            body: JSON.stringify({
              balance: Number((Number(wallet.balance) + Number(withdrawal.amount)).toFixed(2)),
            }),
          }
        );
      }
    }

    const patchBody: Record<string, unknown> = { status: newStatus };
    if (action === 'reject' && admin_note) {
      patchBody.failure_reason = admin_note;
    }
    await fetch(
      `${supabaseUrl}/rest/v1/withdrawals?id=eq.${withdrawal_id}`,
      { method: 'PATCH', headers, body: JSON.stringify(patchBody) }
    );

    await createAuditLog(supabaseUrl, supabaseKey, {
      actor_id: user.sub,
      actor_type: 'user',
      event_type: `payout_${newStatus}`,
      resource_type: 'withdrawal',
      resource_id: withdrawal_id,
      action: 'update',
      status: 'success',
      metadata: { withdrawal_id, action, admin_note, amount: withdrawal.amount, previous_status: 'pending' },
    });

    return new Response(
      JSON.stringify({ success: true, data: { withdrawal_id, status: newStatus } }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

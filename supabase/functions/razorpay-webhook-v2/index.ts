import { createHmacSha256 } from '../_shared/hmac.ts';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const razorpayWebhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;

const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

async function userExists(userId: string): Promise<boolean> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=id&limit=1`,
    { headers }
  );
  const users = await res.json();
  return users && users.length > 0;
}

async function checkIdempotency(referenceId: string): Promise<boolean> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/transactions?reference_id=eq.${referenceId}&limit=1`,
    { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
  );
  const existing = await res.json();
  return existing && existing.length > 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
      },
    });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const expectedSignature = await createHmacSha256(razorpayWebhookSecret, body);

    if (signature !== expectedSignature) {
      return new Response('Unauthorized', { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      
      if (await checkIdempotency(payment.id)) {
        return new Response('OK - duplicate ignored', { status: 200 });
      }

      const payerId = payment.notes?.user_id;
      if (!payerId || !(await userExists(payerId))) {
        return new Response('Unauthorized: user not found', { status: 401 });
      }
      
      const walletRes = await fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${payerId}`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const wallets = await walletRes.json();

      if (wallets && wallets.length > 0) {
        const wallet = wallets[0];
        const newBalance = Number(wallet.balance) + Number(payment.amount) / 100;
        
        await fetch(
          `${supabaseUrl}/rest/v1/wallets?user_id=eq.${payerId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              balance: newBalance.toFixed(2),
              total_recharged: (Number(wallet.total_recharged) + Number(payment.amount) / 100).toFixed(2)
            })
          }
        );

        await fetch(
          `${supabaseUrl}/rest/v1/transactions`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet_id: wallet.id,
              type: 'recharge',
              amount: (Number(payment.amount) / 100).toFixed(2),
              status: 'completed',
              reference_id: payment.id,
              reference_type: 'payment'
            })
          }
        );
      }
    }

    if (event.event === 'payment_link.paid') {
      const payment = event.payload.payment.entity;
      
      if (await checkIdempotency(payment.id)) {
        return new Response('OK - duplicate ignored', { status: 200 });
      }

      const payerId = payment.customer?.notes?.user_id;
      if (!payerId || !(await userExists(payerId))) {
        return new Response('Unauthorized: user not found', { status: 401 });
      }
      
      const walletRes = await fetch(
        `${supabaseUrl}/rest/v1/wallets?user_id=eq.${payerId}`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const wallets = await walletRes.json();

      if (wallets && wallets.length > 0) {
        const wallet = wallets[0];
        const newBalance = Number(wallet.balance) + Number(payment.amount) / 100;
        
        await fetch(
          `${supabaseUrl}/rest/v1/wallets?user_id=eq.${payerId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              balance: newBalance.toFixed(2),
              total_recharged: (Number(wallet.total_recharged) + Number(payment.amount) / 100).toFixed(2)
            })
          }
        );

        await fetch(
          `${supabaseUrl}/rest/v1/transactions`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet_id: wallet.id,
              type: 'recharge',
              amount: (Number(payment.amount) / 100).toFixed(2),
              status: 'completed',
              reference_id: payment.id,
              reference_type: 'payment_link'
            })
          }
        );
      }
    }

    if (event.event === 'payout.processed') {
      const payout = event.payload.payout.entity;
      
      if (await checkIdempotency(payout.id)) {
        return new Response('OK - duplicate ignored', { status: 200 });
      }
      
      await fetch(
        `${supabaseUrl}/rest/v1/transactions`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet_id: payout.notes?.wallet_id,
            type: 'payout',
            amount: (Number(payout.amount) / 100).toFixed(2),
            status: 'completed',
            reference_id: payout.id,
            reference_type: 'payout'
          })
        }
      );

      const walletRes = await fetch(
        `${supabaseUrl}/rest/v1/wallets?id=eq.${payout.notes?.wallet_id}`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const wallets = await walletRes.json();
      
      if (wallets && wallets.length > 0) {
        const wallet = wallets[0];
        await fetch(
          `${supabaseUrl}/rest/v1/wallets?id=eq.${payout.notes?.wallet_id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              total_paid_out: (Number(wallet.total_paid_out) + Number(payout.amount) / 100).toFixed(2)
            })
          }
        );
      }
    }

    if (event.event === 'payout.reversed' || event.event === 'payout.rejected') {
      const payout = event.payload.payout.entity;
      
      if (await checkIdempotency(payout.id)) {
        return new Response('OK - duplicate ignored', { status: 200 });
      }
      
      await fetch(
        `${supabaseUrl}/rest/v1/transactions`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet_id: payout.notes?.wallet_id,
            type: 'payout',
            amount: (Number(payout.amount) / 100).toFixed(2),
            status: event.event === 'payout.rejected' ? 'rejected' : 'reversed',
            reference_id: payout.id,
            reference_type: 'payout'
          })
        }
      );
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
});

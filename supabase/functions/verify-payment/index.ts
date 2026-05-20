import { createHmacSha256 } from '../_shared/hmac.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

interface RequestBody {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

async function creditWallet(userId: string, amount: number, razorpayOrderId: string) {
  const walletRes = await fetch(`${supabaseUrl}/rest/v1/wallets?user_id=eq.${userId}&select=*`, { headers });
  const wallets = await walletRes.json();
  let wallet = wallets?.[0];

  if (!wallet) {
    const newWalletRes = await fetch(`${supabaseUrl}/rest/v1/wallets`, {
      method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ user_id: userId, balance: amount, total_recharged: amount }),
    });
    wallet = (await newWalletRes.json())?.[0];
    return;
  }

  const newBalance = Number((Number(wallet.balance) + amount).toFixed(2));
  await fetch(`${supabaseUrl}/rest/v1/wallets?user_id=eq.${userId}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({
      balance: newBalance,
      total_recharged: Number((Number(wallet.total_recharged || 0) + amount).toFixed(2)),
    }),
  });

  await fetch(`${supabaseUrl}/rest/v1/transactions`, {
    method: 'POST', headers,
    body: JSON.stringify({
      wallet_id: wallet.id, type: 'recharge', amount, status: 'completed',
      balance_before: Number(wallet.balance), balance_after: newBalance,
      description: 'Wallet recharge via Razorpay',
      reference_id: razorpayOrderId, reference_type: 'payment',
    }),
  });
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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature }: RequestBody = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return new Response(
        JSON.stringify({ error: 'All payment verification fields are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const generatedSignature = await createHmacSha256(
      razorpayKeySecret,
      razorpayOrderId + '|' + razorpayPaymentId,
    );

    if (generatedSignature !== razorpaySignature) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const paymentRes = await fetch(
      `${supabaseUrl}/rest/v1/payments?gateway_payment_id=eq.${razorpayOrderId}&select=*`,
      { headers }
    );
    const payments = await paymentRes.json();
    const payment = payments?.[0];

    if (!payment) {
      return new Response(
        JSON.stringify({ error: 'Payment record not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await fetch(
      `${supabaseUrl}/rest/v1/payments?id=eq.${payment.id}`,
      {
        method: 'PATCH', headers,
        body: JSON.stringify({ status: 'completed', gateway_payment_id: razorpayPaymentId })
      }
    );

    await creditWallet(payment.user_id, Number(payment.amount), razorpayOrderId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

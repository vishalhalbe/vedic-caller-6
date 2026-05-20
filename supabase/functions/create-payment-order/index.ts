import { validateBody } from '../_shared/validation.ts';
import { getAuthToken, createAuthError, verifyToken } from '../_shared/auth.ts';
import { checkRateLimit, limiters } from '../_shared/rate-limiting.ts';
import { createAuditLog } from '../_shared/audit-logging.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

interface RequestBody {
  userId: string;
  amount: number;
  currency?: string;
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
    const validationErrors = validateBody(body, ['userId', 'amount']);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: validationErrors.map(e => e.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { userId, amount, currency = 'INR' } = body;

    const rateLimitCheck = checkRateLimit(limiters.paymentOrder, userId);
    if (rateLimitCheck) return rateLimitCheck;

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: { user_id: userId },
      }),
    });

    if (!razorpayRes.ok) {
      const errorBody = await razorpayRes.text();
      return new Response(
        JSON.stringify({ error: `Razorpay order creation failed: ${errorBody}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const razorpayOrder = await razorpayRes.json();
    const razorpayOrderId = razorpayOrder.id;

    const paymentRes = await fetch(
      `${supabaseUrl}/rest/v1/payments`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          gateway: 'razorpay',
          gateway_payment_id: razorpayOrderId,
          amount: amount,
          currency,
          status: 'pending',
        })
      }
    );
    const payment = await paymentRes.json();

    await createAuditLog(supabaseUrl, supabaseKey, {
      actor_id: user.sub || userId,
      actor_type: 'user',
      event_type: 'wallet_recharge',
      resource_type: 'payment',
      resource_id: payment[0]?.id || razorpayOrderId,
      action: 'create',
      status: 'success',
      metadata: { amount, currency, razorpayOrderId },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId: payment[0]?.id,
          razorpayOrderId: razorpayOrderId,
          keyId: razorpayKeyId,
          amount,
          currency,
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

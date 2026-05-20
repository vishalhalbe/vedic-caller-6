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
  customer_id: string;
  astrologer_id: string;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  log('INFO', 'Incoming request', { requestId, method: req.method, url: req.url });

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
    const rateLimitCheck = checkRateLimit(limiters.initiateCall, requestId);
    if (rateLimitCheck) return rateLimitCheck;

    const body: RequestBody = await req.json();
    const { customer_id, astrologer_id } = body;
    log('INFO', 'Parsed request body', { requestId, customer_id, astrologer_id });

    const validationErrors = validateBody(body, ['customer_id', 'astrologer_id']);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: validationErrors.map(e => e.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const walletRes = await fetch(
      `${supabaseUrl}/rest/v1/wallets?user_id=eq.${customer_id}&select=*`,
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
    const totalBalance = Number(wallet.balance) + Number(wallet.bonus_balance || 0);
    log('INFO', 'Wallet fetched', { requestId, walletId: wallet.id, balance: totalBalance });

    const astroRes = await fetch(
      `${supabaseUrl}/rest/v1/astrologers?id=eq.${astrologer_id}&select=*,users!astrologers_user_id_fkey(email)`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const astrologers = await astroRes.json();

    if (!astrologers || astrologers.length === 0) {
      log('WARN', 'Astrologer not found', { requestId, astrologer_id });
      return new Response(
        JSON.stringify({ error: 'Astrologer not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const astrologer = astrologers[0];
    log('INFO', 'Astrologer fetched', { requestId, astrologerId: astrologer.id, isOnline: astrologer.is_online });

    if (!astrologer.is_available || !astrologer.is_online) {
      log('WARN', 'Astrologer not available', { requestId, astrologer_id, isAvailable: astrologer.is_available, isOnline: astrologer.is_online });
      return new Response(
        JSON.stringify({ error: 'Astrologer not available' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const activeCallRes = await fetch(
      `${supabaseUrl}/rest/v1/calls?customer_id=eq.${customer_id}&status=in.("initiated","active")&select=id,status`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const activeCalls = await activeCallRes.json();
    if (activeCalls && activeCalls.length > 0) {
      log('WARN', 'Duplicate call prevented', { requestId, customer_id, existingCallId: activeCalls[0].id });
      return new Response(
        JSON.stringify({ success: false, error: 'An active call already exists for this customer' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const channelName = `call_${customer_id}_${astrologer_id}_${Date.now()}`;
    const agoraAppId = Deno.env.get('AGORA_APP_ID');

    if (!agoraAppId) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('INFO', 'Creating call record', { requestId, channelName, pricePerMin: astrologer.price_per_minute });

    const callRes = await fetch(
      `${supabaseUrl}/rest/v1/calls`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          customer_id,
          astrologer_id,
          agora_channel_name: channelName,
          status: 'initiated',
          customer_balance_before: totalBalance,
          per_second_rate: Number((astrologer.price_per_minute / 60).toFixed(4))
        })
      }
    );
    const call = await callRes.json();
    const callId = call[0]?.id;

    await createAuditLog(supabaseUrl, supabaseKey, {
      actor_id: customer_id,
      actor_type: 'user',
      event_type: 'call_initiated',
      resource_type: 'call',
      resource_id: callId || channelName,
      action: 'create',
      status: 'success',
      metadata: { astrologer_id, channel_name: channelName }
    });

    log('INFO', 'Call initiated successfully', { requestId, callId, channelName });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          call_id: callId,
          channel_name: channelName,
          agora_app_id: agoraAppId,
          current_balance: totalBalance,
          astrologer_name: astrologer.display_name
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log('ERROR', 'Error initiating call', { requestId, error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

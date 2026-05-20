import { getAuthToken, createAuthError, verifyToken } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit-logging.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

interface RequestBody {
  is_online?: boolean;
  is_available?: boolean;
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

    const astroRes = await fetch(
      `${supabaseUrl}/rest/v1/astrologers?user_id=eq.${user.sub}&select=id,is_online,is_available`,
      { headers }
    );
    const astrologers = await astroRes.json();
    const astrologer = astrologers?.[0];

    if (!astrologer) {
      return new Response(
        JSON.stringify({ error: 'Astrologer profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.is_online !== undefined) updates.is_online = body.is_online;
    if (body.is_available !== undefined) updates.is_available = body.is_available;

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'Provide is_online and/or is_available to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await fetch(
      `${supabaseUrl}/rest/v1/astrologers?id=eq.${astrologer.id}`,
      { method: 'PATCH', headers, body: JSON.stringify(updates) }
    );

    await createAuditLog(supabaseUrl, supabaseKey, {
      actor_id: user.sub,
      actor_type: 'user',
      event_type: 'astrologer_status_change',
      resource_type: 'astrologer',
      resource_id: astrologer.id,
      action: 'update',
      status: 'success',
      metadata: { previous: { is_online: astrologer.is_online, is_available: astrologer.is_available }, updates },
    });

    return new Response(
      JSON.stringify({ success: true, data: { ...astrologer, ...updates } }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

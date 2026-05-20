import { getAuthToken, createAuthError, verifyToken } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

interface RequestBody {
  astrologer_id: string;
  action: 'add' | 'remove';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    });
  }

  try {
    const authToken = getAuthToken(req);
    if (!authToken) return createAuthError();
    const user = await verifyToken(authToken, supabaseUrl);
    if (!user) return createAuthError('Invalid token');

    const { pathname } = new URL(req.url);

    if (req.method === 'GET') {
      const favRes = await fetch(
        `${supabaseUrl}/rest/v1/favorites?user_id=eq.${user.sub}&select=*,astrologers!inner(id,display_name,specialization,price_per_minute,rating,avatar_url)`,
        { headers }
      );
      const favorites = await favRes.json();
      return new Response(
        JSON.stringify({ success: true, data: favorites }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE' && pathname.includes('/')) {
      const parts = pathname.split('/');
      const astrologerId = parts[parts.length - 1];
      await fetch(
        `${supabaseUrl}/rest/v1/favorites?user_id=eq.${user.sub}&astrologer_id=eq.${astrologerId}`,
        { method: 'DELETE', headers }
      );
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { astrologer_id, action }: RequestBody = await req.json();

    if (!astrologer_id) {
      return new Response(
        JSON.stringify({ error: 'astrologer_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add') {
      const existingRes = await fetch(
        `${supabaseUrl}/rest/v1/favorites?user_id=eq.${user.sub}&astrologer_id=eq.${astrologer_id}&limit=1`,
        { headers }
      );
      const existing = await existingRes.json();
      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ success: true, data: existing[0] }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      const favRes = await fetch(
        `${supabaseUrl}/rest/v1/favorites`,
        {
          method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({ user_id: user.sub, astrologer_id }),
        }
      );
      const newFav = await favRes.json();
      return new Response(
        JSON.stringify({ success: true, data: newFav[0] }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'remove') {
      await fetch(
        `${supabaseUrl}/rest/v1/favorites?user_id=eq.${user.sub}&astrologer_id=eq.${astrologer_id}`,
        { method: 'DELETE', headers }
      );
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use add, remove, or GET to list' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

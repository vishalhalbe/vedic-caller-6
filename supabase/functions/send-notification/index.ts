const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

interface RequestBody {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    });
  }

  try {
    const { userId, title, body, data }: RequestBody = await req.json();
    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'userId, title, and body are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=fcm_token&limit=1`,
      { headers }
    );
    const users = await userRes.json();
    const user = users?.[0];

    if (!user || !user.fcm_token) {
      await fetch(
        `${supabaseUrl}/rest/v1/notifications`,
        {
          method: 'POST', headers,
          body: JSON.stringify({ user_id: userId, title, body, data: data || {}, status: 'failed' }),
        }
      );
      return new Response(
        JSON.stringify({ success: false, error: 'User has no FCM token' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.fcm_token,
        notification: { title, body },
        data: data || {},
      }),
    });

    const fcmResult = await fcmRes.json();
    const status = fcmRes.ok && fcmResult.success === 1 ? 'sent' : 'failed';

    await fetch(
      `${supabaseUrl}/rest/v1/notifications`,
      {
        method: 'POST', headers,
        body: JSON.stringify({ user_id: userId, title, body, data: data || {}, status }),
      }
    );

    return new Response(
      JSON.stringify({ success: status === 'sent', data: { status, fcm_result: fcmResult } }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

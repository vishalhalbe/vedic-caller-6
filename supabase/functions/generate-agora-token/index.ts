import { RtcTokenBuilder, RtcRole } from "npm:agora-token@2.0.2";

const agoraAppId = Deno.env.get('AGORA_APP_ID');
const agoraCertificate = Deno.env.get('AGORA_CERTIFICATE');

interface RequestBody {
  channel_name?: string;
  channelName?: string;
  uid: string | number;
  role?: string | number;
  expireTime?: number;
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
    if (!agoraAppId || !agoraCertificate) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: AGORA_APP_ID and AGORA_CERTIFICATE must be set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const channelName = body.channel_name || body.channelName;
    const uidStr = String(body.uid);
    const expireTime = body.expireTime || 3600;

    if (!channelName || !body.uid) {
      return new Response(
        JSON.stringify({ error: 'channelName and uid are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rtcRole = body.role === 'subscriber' ? RtcRole.ROLE_SUBSCRIBER : RtcRole.ROLE_PUBLISHER;
    const uidNum = parseInt(uidStr.replace(/\D/g, '').slice(-10)) || Math.floor(Math.random() * 100000);
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expireTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
      agoraAppId,
      agoraCertificate,
      channelName,
      uidNum,
      rtcRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token,
          app_id: agoraAppId,
          channel: channelName,
          uid: uidNum,
          expires_in: expireTime,
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

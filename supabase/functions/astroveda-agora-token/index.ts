import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const AGORA_APP_ID = Deno.env.get("AGORA_APP_ID") || ""
const AGORA_APP_CERTIFICATE = Deno.env.get("AGORA_APP_CERTIFICATE") || ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || ""

function generateAgoraToken(
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber",
  expireTimeInSeconds: number
): string {
  const currentTime = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTime + expireTimeInSeconds

  const encoder = new TextEncoder()
  const appIdBytes = encoder.encode(AGORA_APP_ID.padEnd(32, "\0").slice(0, 32))
  const certBytes = encoder.encode(AGORA_APP_CERTIFICATE.padEnd(32, "\0").slice(0, 32))
  const channelBytes = encoder.encode(channelName)

  const content = new Uint8Array([
    ...appIdBytes,
    ...channelBytes,
    ...numberToBytes(currentTime),
    ...numberToBytes(privilegeExpiredTs),
    ...numberToBytes(uid),
    role === "publisher" ? 1 : 2,
  ])

  return btoa(String.fromCharCode(...content))
}

function numberToBytes(num: number): Uint8Array {
  const buf = new ArrayBuffer(4)
  const view = new DataView(buf)
  view.setUint32(0, num, false)
  return new Uint8Array(buf)
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const { action, booking_id, channel_name, uid, role } = body

    if (action === "generate_token") {
      if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
        return new Response(
          JSON.stringify({ error: "Agora credentials not configured" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      }

      const token = generateAgoraToken(
        channel_name || `astroveda_${booking_id}`,
        uid || 0,
        role || "subscriber",
        3600
      )

      return new Response(
        JSON.stringify({
          token,
          channel_name: channel_name || `astroveda_${booking_id}`,
          app_id: AGORA_APP_ID,
          uid: uid || 0,
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    if (action === "update_call_status") {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
      })

      const { error: updateErr } = await supabase
        .from("astroveda_bookings")
        .update({ status: "completed" })
        .eq("id", booking_id)

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

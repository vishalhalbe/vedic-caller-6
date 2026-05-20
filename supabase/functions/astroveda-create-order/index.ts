import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || ""
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || ""

function base64Encode(str: string): string {
  return btoa(str)
}

async function createRazorpayOrder(amount: number, receipt: string) {
  const auth = base64Encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
      payment_capture: 1,
    }),
  })
  return res.json()
}

async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
) {
  const body = orderId + "|" + paymentId
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(RAZORPAY_KEY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  )
  const expected = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  )
  const expectedHex = Array.from(new Uint8Array(expected))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return expectedHex === signature
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const { action, booking_id, amount, receipt, order_id, payment_id, signature } = body

    if (action === "create_order") {
      const order = await createRazorpayOrder(amount, receipt)

      if (order.error) {
        return new Response(JSON.stringify({ error: order.error.description }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    if (action === "verify_payment") {
      const isValid = await verifyPaymentSignature(order_id, payment_id, signature)

      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid payment signature" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
      })

      if (booking_id) {
        const { error: updateErr } = await supabase
          .from("astroveda_bookings")
          .update({ status: "confirmed", payment_id })
          .eq("id", booking_id)

        if (updateErr) {
          return new Response(JSON.stringify({ error: updateErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        }
      }

      return new Response(
        JSON.stringify({ success: true, payment_id }),
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

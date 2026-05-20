import { getAuthToken, createAuthError, verifyToken } from '../_shared/auth.ts';
import { validateBody } from '../_shared/validation.ts';
import { createAuditLog } from '../_shared/audit-logging.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

interface RequestBody {
  astrologer_id: string;
  call_id?: string;
  rating: number;
  comment?: string;
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

    const body: RequestBody = await req.json();
    const validationErrors = validateBody(body, ['astrologer_id', 'rating']);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: validationErrors.map(e => e.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/reviews?user_id=eq.${user.sub}&astrologer_id=eq.${body.astrologer_id}&limit=1`,
      { headers }
    );
    const existing = await existingRes.json();

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You have already reviewed this astrologer' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const reviewRes = await fetch(
      `${supabaseUrl}/rest/v1/reviews`,
      {
        method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          user_id: user.sub,
          astrologer_id: body.astrologer_id,
          call_id: body.call_id || null,
          rating: body.rating,
          comment: body.comment || null,
        }),
      }
    );
    const review = await reviewRes.json();

    const ratingRes = await fetch(
      `${supabaseUrl}/rest/v1/reviews?astrologer_id=eq.${body.astrologer_id}&select=rating`,
      { headers }
    );
    const allRatings = await ratingRes.json();
    const avgRating = allRatings.length > 0
      ? Number((allRatings.reduce((s: number, r: { rating: number }) => s + Number(r.rating), 0) / allRatings.length).toFixed(1))
      : body.rating;

    await fetch(
      `${supabaseUrl}/rest/v1/astrologers?id=eq.${body.astrologer_id}`,
      { method: 'PATCH', headers, body: JSON.stringify({ rating: avgRating }) }
    );

    await createAuditLog(supabaseUrl, supabaseKey, {
      actor_id: user.sub,
      actor_type: 'user',
      event_type: 'review_created',
      resource_type: 'review',
      resource_id: review[0]?.id || 'unknown',
      action: 'create',
      status: 'success',
      metadata: { astrologer_id: body.astrologer_id, rating: body.rating, new_average: avgRating },
    });

    return new Response(
      JSON.stringify({ success: true, data: review[0] }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

import { getAuthToken, createAuthError, verifyToken } from '../_shared/auth.ts';
import { validateBody } from '../_shared/validation.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

interface BankAccountBody {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  is_default?: boolean;
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
      const baRes = await fetch(
        `${supabaseUrl}/rest/v1/bank_accounts?user_id=eq.${user.sub}&order=created_at.desc`,
        { headers }
      );
      const accounts = await baRes.json();
      return new Response(
        JSON.stringify({ success: true, data: accounts }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const parts = pathname.split('/');
      const accountId = parts[parts.length - 1];
      if (!accountId || accountId === 'bank-accounts') {
        return new Response(
          JSON.stringify({ error: 'Account ID required in path' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const ownRes = await fetch(
        `${supabaseUrl}/rest/v1/bank_accounts?id=eq.${accountId}&user_id=eq.${user.sub}&select=id`,
        { headers }
      );
      const ownAccounts = await ownRes.json();
      if (!ownAccounts || ownAccounts.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Bank account not found or access denied' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      await fetch(
        `${supabaseUrl}/rest/v1/bank_accounts?id=eq.${accountId}`,
        { method: 'DELETE', headers }
      );
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: BankAccountBody = await req.json();
    const validationErrors = validateBody(body, ['account_holder_name', 'account_number', 'ifsc_code', 'bank_name']);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: validationErrors.map(e => e.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.is_default) {
      await fetch(
        `${supabaseUrl}/rest/v1/bank_accounts?user_id=eq.${user.sub}`,
        { method: 'PATCH', headers, body: JSON.stringify({ is_default: false }) }
      );
    }

    const baRes = await fetch(
      `${supabaseUrl}/rest/v1/bank_accounts`,
      {
        method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          user_id: user.sub,
          account_holder_name: body.account_holder_name,
          account_number: body.account_number,
          ifsc_code: body.ifsc_code,
          bank_name: body.bank_name,
          is_default: body.is_default || false,
        }),
      }
    );
    const account = await baRes.json();

    return new Response(
      JSON.stringify({ success: true, data: account[0] }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

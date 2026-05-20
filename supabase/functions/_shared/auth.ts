export function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const apikey = req.headers.get('apikey');
  if (apikey) return apikey;
  return null;
}

export function createAuthError(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

const ANON_KEY_PREFIX = 'sb_publishable_';
const SERVICE_ROLE_PREFIX = 'sb_publishable_';

export async function verifyToken(token: string, supabaseUrl: string): Promise<{ sub?: string; email?: string; role?: string } | null> {
  if (token.startsWith(ANON_KEY_PREFIX)) {
    return { sub: 'anon', role: 'anon' };
  }
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': token }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

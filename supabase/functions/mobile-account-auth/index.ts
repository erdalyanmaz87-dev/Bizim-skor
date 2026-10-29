// No third-party runtime dependencies. Auth and RPC requests use platform fetch.
// Deploy with JWT verification disabled: login/signup/recover are public endpoints.
// All identity mutations remain verified-user RPCs, outside this public gateway.
import { handleAction } from './core.mjs';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowedOrigins = new Set(['https://bizimskor.com', 'https://www.bizimskor.com', 'https://bizim-skor-live.vercel.app', 'https://localhost', 'http://localhost', 'capacitor://localhost']);
const encoder = new TextEncoder();
const hmacKey = crypto.subtle.importKey('raw', encoder.encode(serviceKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
async function keyHash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey, encoder.encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
async function rpc(name: string, body: object) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Private RPC unavailable');
  return response.json();
}
async function auth(path: string, body: object) {
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  return { response, data };
}
function mailUnavailable(response: Response, data: Record<string, unknown>) {
  // Only provider/infra errors; never surface "already registered" or unknown email.
  return response.status >= 500 || ['email_address_not_authorized','over_email_send_rate_limit','email_provider_disabled','email_address_invalid'].includes(String(data.code));
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  if (origin && !allowedOrigins.has(origin)) return new Response(JSON.stringify({ error: 'origin_not_allowed' }), { status: 403, headers });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  try {
    // Content-Length may be absent or forged: enforce a stream limit too.
    const reader = request.body?.getReader();
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    if (!reader) throw new Error('Missing body');
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) { await reader.cancel(); return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 413, headers }); }
      chunks.push(value);
    }
    const bodyBytes = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { bodyBytes.set(chunk, offset); offset += chunk.byteLength; }
    const input = JSON.parse(new TextDecoder().decode(bodyBytes));
    // The global and identifier buckets remain effective if forwarding headers
    // are absent/spoofed. Validate gateway proxy normalization before production.
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 200);
    const result = await handleAction(input, {
      async gate(action: string, identifier: string) {
        const keys = await Promise.all([
          keyHash(`${action}:global`), keyHash(`${action}:ip:${ip}`), keyHash(`${action}:identity:${identifier}`),
        ]);
        return await rpc('mobile_auth_gate', { p_keys: keys, p_limits: [500, 30, action === 'login' ? 10 : 3] }) === true;
      },
      resolveEmail: (name: string) => rpc('mobile_auth_email_for_name', { p_name: name }),
      async passwordSignIn(email: string, password: string) {
        const { response, data } = await auth('token?grant_type=password', { email, password });
        return response.ok ? { session: data } : { error: true };
      },
      async signup(email: string, password: string, name: string) {
        const { response, data } = await auth('signup?redirect_to=https%3A%2F%2Fbizimskor.com', {
          email, password, data: { pending_player_name: name },
        });
        if (mailUnavailable(response, data)) return { unavailable: true };
        // Never return an auto-confirmed session. This signals a deployment
        // configuration error, not proof of email ownership.
        if (data.access_token) return { configurationError: true };
        if (!response.ok && !['user_already_exists','email_exists'].includes(data.code)) return { error: true };
        return {};
      },
      async recover(email: string) {
        const { response, data } = await auth('recover?redirect_to=https%3A%2F%2Fbizimskor.com', { email });
        return { unavailable: mailUnavailable(response, data) };
      },
    });
    return new Response(JSON.stringify(result.body), { status: result.status, headers });
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400, headers });
  }
});


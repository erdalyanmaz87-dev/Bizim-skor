// Environment-independent gateway policy, exercised with synthetic providers.
export const AUTH_FAILURE = { error: 'invalid_credentials' };
export const RECOVERY_RESPONSE = { ok: true };
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
export function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);
}
export function validName(value) {
  return typeof value === 'string' && value.trim().length >= 3 && value.trim().length <= 30 &&
    /^[\p{L}\p{N}_. -]+$/u.test(value.trim());
}
const reply = (status, body) => ({ status, body });
// deps: gate(action,identifier), resolveEmail(name), passwordSignIn(email,password),
// signup(email,password,name), recover(email). Provider results never enter errors.
export async function handleAction(input, deps) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { error: 'invalid_request' });
  const { action } = input;
  if (!['login', 'signup', 'recover'].includes(action)) return reply(400, { error: 'invalid_request' });
  const rawIdentifier = action === 'login' ? input.identifier : input.email;
  const identifier = typeof rawIdentifier === 'string' ? rawIdentifier.trim() : '';
  if (!identifier || identifier.length > 254) {
    return action === 'recover' ? reply(200, RECOVERY_RESPONSE) : reply(400, { error: 'invalid_request' });
  }
  try {
    if (!await deps.gate(action, identifier.toLowerCase())) return reply(429, { error: 'rate_limited' });
    if (action === 'recover') {
      if (validEmail(identifier)) {
        // Never expose per-address sending outcomes, including SMTP failures:
        // unknown addresses may succeed without attempting delivery. Sender
        // availability is a deployment prerequisite communicated by the UI.
        try { await deps.recover(identifier); } catch { /* Same public outcome. */ }
      }
      return reply(200, RECOVERY_RESPONSE);
    }
    if (typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 256) {
      return reply(action === 'login' ? 401 : 400, action === 'login' ? AUTH_FAILURE : { error: 'password_too_short_or_long' });
    }
    if (action === 'signup') {
      if (!validEmail(identifier) || !validName(input.name)) return reply(400, { error: 'invalid_signup' });
      const result = await deps.signup(identifier, input.password, input.name.trim());
      if (result?.unavailable) return reply(503, { error: 'email_service_unavailable' });
      if (result?.configurationError) return reply(503, { error: 'email_confirmation_required' });
      if (result?.error) return reply(400, { error: 'signup_failed' });
      return reply(200, { needsConfirmation: true });
    }
    // Always run the same password endpoint, including unknown user names.
    const isEmail = validEmail(identifier);
    const resolved = isEmail ? identifier : await deps.resolveEmail(identifier);
    const result = await deps.passwordSignIn(resolved || 'unknown-account@invalid.example', input.password);
    if (!resolved || result?.error || !result?.session?.access_token || !result.session.user?.email_confirmed_at) {
      return reply(401, AUTH_FAILURE);
    }
    return reply(200, { session: result.session });
  } catch {
    // A database outage fails closed; no email, name, password or provider detail
    // is reflected or logged, including exceptions from the private lookup.
    return reply(503, { error: 'auth_service_unavailable' });
  }
}

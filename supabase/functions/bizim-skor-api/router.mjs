export function resolveRoute(method, pathname) {
  if (method !== 'GET' && method !== 'OPTIONS') return { type: 'method_not_allowed' };
  if (method === 'OPTIONS') return { type: 'options' };
  if (pathname === '/health' || pathname.endsWith('/bizim-skor-api/health')) return { type: 'health' };
  return { type: 'not_found' };
}

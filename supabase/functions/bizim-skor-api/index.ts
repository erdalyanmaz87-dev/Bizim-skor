import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { resolveRoute } from "./router.mjs";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "authorization, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  const route = resolveRoute(req.method, url.pathname);

  if (route.type === "options") return new Response(null, { status: 204, headers });
  if (route.type === "method_not_allowed") return json(405, { ok: false, error: { code: "method_not_allowed" } });
  if (route.type === "health") return json(200, { ok: true, data: { service: "bizim-skor-api", version: "v1", mode: "read-only" }, meta: {} });
  return json(404, { ok: false, error: { code: "not_found" } });
});

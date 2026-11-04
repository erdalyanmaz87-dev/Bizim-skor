// Obsolete test broadcaster. Retired rather than left as an alternate sender.
Deno.serve(()=>new Response(JSON.stringify({ok:false,error:'endpoint_retired'}),{status:410,headers:{'content-type':'application/json','Cache-Control':'no-store'}}));

importScripts('/push-sw.js?v=20261014-badge-v1');
const CACHE_VERSION='bizim-skor-20261022-navigation-recovery-v1';
self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE_VERSION).map(key=>caches.delete(key)));await self.clients.claim()})())});
// Always resolve navigation requests with a Response, even on a first offline launch.
async function fetchWithRecovery(request){
 try{return await fetch(request)}catch(error){
  if(request.mode==='navigate'){
   try{return await fetch(request,{cache:'reload'})}catch(retryError){}
  }
  const cached=await caches.match(request).catch(()=>undefined);
  if(cached)return cached;
  if(request.mode!=='navigate')return Response.error();
  return new Response(`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bizim Skor • Bağlantı</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071633;color:#fff;font:18px system-ui}main{max-width:420px;padding:28px}button{padding:14px 24px;border:0;border-radius:12px;background:#f8c948;color:#071633;font:inherit;font-weight:700}</style><main><h1>Bizim Skor</h1><p>Şu anda bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene. Gerekirse Wi-Fi ile mobil veri arasında geçiş yap.</p><button onclick="location.reload()">Tekrar dene</button></main></html>`,{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
 }
}
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 event.respondWith(fetchWithRecovery(event.request));
});

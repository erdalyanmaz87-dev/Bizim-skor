// Keep push notifications and badges, but let the browser handle page and asset requests.
// Avoid Safari's FetchEvent.respondWith null response failure on unstable connections.
importScripts('/push-sw.js?v=20261014-badge-v1');
const CACHE_VERSION='bizim-skor-20261022-native-navigation-v2';
self.addEventListener('install',event=>self.skipWaiting());
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('bizim-skor-')&&key!==CACHE_VERSION).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
// No fetch handler: Safari and Chrome perform navigation and asset loading natively.

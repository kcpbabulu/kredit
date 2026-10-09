/* DaKOPen V65 PWA - static asset cache; API and non-GET requests bypass cache. */
const CACHE_VERSION = 'dakopen-static-v70';
const APP_SHELL = ['./','./index.html','./style.css?v=70','./app.js?v=70','./manifest.json'];
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    await Promise.all(APP_SHELL.map(async url=>{try{const res=await fetch(url,{cache:'reload'});if(res.ok)await cache.put(url,res);}catch(e){console.warn('Asset belum tersedia untuk cache:',url);}}));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('dakopen-static-')&&k!==CACHE_VERSION).map(k=>caches.delete(k)));await self.clients.claim();})());
});
self.addEventListener('fetch', event => {
  const req=event.request; const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/macros/s/')) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    try { const fresh=await fetch(req); if(fresh&&fresh.ok&&fresh.type!=='opaque') cache.put(req,fresh.clone()).catch(()=>{}); return fresh; }
    catch(err) { const cached=await cache.match(req)||await cache.match('./index.html'); if(cached)return cached; throw err; }
  })());
});

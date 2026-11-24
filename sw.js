/* DaKOPen PWA v1570 — strategi cache per jenis berkas.
   - Halaman (index): jaringan dulu (maks 4 dtk), cadangan dari cache → selalu versi terbaru bila online.
   - Aset berversi (?v=...): cache dulu → instan, versi baru otomatis karena angka ?v berubah.
   - Library CDN & font: tampil dari cache, diperbarui di latar belakang.
   - Panggilan API Apps Script TIDAK pernah dicache di sini (data debitur). */
const CACHE_VERSION = 'dakopen-static-v1593-ux-polish';
const APP_SHELL = ['./','./index.html','./style.css?v=1593','./dak-banking.css?v=1520','./dak-interact.css?v=1590','./dak-polish.css?v=1590','./dak-detail.css?v=1593','./dak-interact.js?v=1590','./dak-detail.js?v=1590','./app.js?v=1593','./manifest.json'];
const CDN_HOSTS = ['cdnjs.cloudflare.com','cdn.jsdelivr.net','unpkg.com','cdn.sheetjs.com','cdn.tailwindcss.com','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(APP_SHELL.map(async url => {
      try { const res = await fetch(url, { cache: 'reload' }); if (res.ok) await cache.put(url, res); }
      catch (e) { console.warn('Asset belum tersedia untuk cache:', url); }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('dakopen-static-') && k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(req);
  const net = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  if (hit) { event.waitUntil(net); return hit; }
  return (await net) || Response.error();
}
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
  return res;
}
async function networkFirst(req, timeoutMs) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))]);
    if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match(req) || await cache.match('./index.html');
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.includes('/macros/s/')) return;
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) { event.respondWith(networkFirst(req, 4000)); return; }
    if (url.search.indexOf('v=') >= 0) { event.respondWith(cacheFirst(req)); return; }
    event.respondWith(staleWhileRevalidate(event, req)); return;
  }
  if (CDN_HOSTS.indexOf(url.hostname) >= 0) event.respondWith(staleWhileRevalidate(event, req));
});

// UBAH NAMA ATAU ANGKA VERSI INI SETIAP KALI ANDA MENGUBAH KODINGAN!
const CACHE_VERSION = 'dakopen-cache-v60'; 

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png'
];

// 1. Proses Install: Simpan satu per satu agar tidak error jika ada file yang hilang
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log('Mulai menyimpan cache...');
      // Menggunakan Promise.all dan map agar error 1 file tidak membatalkan semuanya
      return Promise.all(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn('⚠️ File ini dilewati karena tidak ditemukan di server:', url);
          });
        })
      );
    })
  );
});

// 2. Proses Activate: Hapus SEMUA cache versi lama agar memori HP pengguna bersih
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            console.log('🧹 Membersihkan cache kodingan lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Ambil alih kontrol halaman saat ini juga
  );
});

// 3. Proses Fetch (Network-First Strategy)
// Selalu usahakan ambil kodingan terbaru dari internet (GitHub). Jika tidak ada sinyal, baru pakai Cache.
self.addEventListener('fetch', event => {
  // Abaikan request ke server Google Apps Script (biarkan app.js yang menanganinya)
  if (event.request.url.includes('script.google.com')) {
      return; 
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jika berhasil ambil versi terbaru dari internet, simpan ke Cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Jika HP tidak ada sinyal (Offline), gunakan file yang ada di Cache
        return caches.match(event.request);
      })
  );
});

/* Service Worker — ตรวจค่าคอม SSC (ทำให้ใช้งานออฟไลน์ + ติดตั้งเป็นแอปได้) */
const CACHE = 'ssc-comm-v42';
const ASSETS = [
  './', './index.html', './manifest.json',
  './logo.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@500;600;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;                 // POST ไป Google Sheet → ผ่านเน็ตตรง
  if (e.request.url.includes('script.google.com')) return; // อย่า cache ข้อมูล Sheet (ต้องสด)
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy).catch(() => {}));
        return resp;
      }).catch(() => caches.match('./index.html'))
    )
  );
});

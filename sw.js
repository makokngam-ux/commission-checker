/* Service Worker — ตรวจค่าคอม SSC (ทำให้ใช้งานออฟไลน์ + ติดตั้งเป็นแอปได้) */
const CACHE = 'ssc-comm-v50';
const ASSETS = [
  './', './index.html', './manifest.json',
  './logo.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=Noto+Serif+Thai:wght@500;600;700&display=swap'
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
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate' ||
    (url.origin === location.origin && /(\/|index\.html|sw\.js|manifest\.json)$/.test(url.pathname));
  if (isPage) {
    // ตัวแอป: ลองเน็ตก่อน → ได้รุ่นล่าสุดทันทีที่เปิด · ไม่มีเน็ต/ช้าเกิน 4 วิ ค่อยใช้ของที่เก็บไว้
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 4000);
        const resp = await fetch(e.request, { cache: 'no-cache', signal: ctl.signal }); clearTimeout(timer);
        if (resp && resp.ok) cache.put(e.request, resp.clone()).catch(() => {});
        return resp;
      } catch (err) {
        return (await cache.match(e.request)) || (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy).catch(() => {}));
        return resp;
      })
    )
  );
});

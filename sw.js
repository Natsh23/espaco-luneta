const CACHE = 'luneta-v1';
const ASSETS = ['index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e=>{
  // Para requisições ao Firebase — sempre vai para a rede
  if(e.request.url.includes('firestore') || e.request.url.includes('googleapis')){
    e.respondWith(fetch(e.request));
    return;
  }
  // Para os assets do app — cache primeiro, depois rede
  e.respondWith(
    caches.match(e.request).then(cached=>cached || fetch(e.request).then(res=>{
      const clone = res.clone();
      caches.open(CACHE).then(c=>c.put(e.request, clone));
      return res;
    }))
  );
});

const CACHE = 'luneta-v2';
const ASSETS = ['manifest.json', 'icon-192.png', 'icon-512.png'];

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
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = req.url;
  // Firebase / Google: sempre rede, sem interferência
  if(url.includes('firestore') || url.includes('googleapis') || url.includes('gstatic')) return;

  // HTML: rede primeiro (atualizações aparecem na hora); cache só como fallback offline
  if(req.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')){
    e.respondWith(
      fetch(req).then(res=>{
        const clone = res.clone();
        caches.open(CACHE).then(c=>c.put(req, clone));
        return res;
      }).catch(()=>caches.match(req).then(r=>r || caches.match('index.html')))
    );
    return;
  }

  // Demais arquivos: cache primeiro
  e.respondWith(
    caches.match(req).then(cached=>cached || fetch(req).then(res=>{
      const clone = res.clone();
      caches.open(CACHE).then(c=>c.put(req, clone));
      return res;
    }))
  );
});

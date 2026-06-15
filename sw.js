// 場勘紀錄 Service Worker — 離線快取 App 外殼
// 改動 index.html 後，把 CACHE 版本號 +1（例如 v2 → v3），手機下次連網會自動更新。
const CACHE = 'site-survey-v1';
const ASSETS = [
  './',
  './index.html'
];

// 安裝：把 App 外殼存進快取
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

// 啟用：清掉舊版本快取
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    ))
  );
  self.clients.claim();
});

// 取用策略：
// - 上傳（POST，例如送到 Apps Script）一律走網路，絕不快取
// - 其他資源：先給快取（離線可開），背景同時更新
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET'){ return; }            // 上傳等非 GET：交給瀏覽器正常連網
  e.respondWith(
    caches.match(req).then(cached=>{
      const network = fetch(req).then(res=>{
        if(res && res.status===200 && req.url.startsWith(self.location.origin)){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
        }
        return res;
      }).catch(()=>cached);                       // 沒網路就回快取
      return cached || network;
    })
  );
});

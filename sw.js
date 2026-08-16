// Service Worker - Offline First с Workbox-подобной логикой
const CACHE_NAME='mtb-skills-v1';
const STATIC_ASSETS=[
  '/',
  '/index.html',
  '/manifest.json'
];
const CACHE_STRATEGIES={
  // Cache First - для статики (CSS, JS, images, fonts)
  static:async(request,cache)=>{
    const cached=await cache.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok)cache.put(request,response.clone());
      return response;
    }catch(e){return cached||new Response('',{status:503});}
  },
  // Stale While Revalidate - для HTML
  html:async(request,cache)=>{
    const cached=await cache.match(request);
    const fetchPromise=fetch(request).then(response=>{
      if(response.ok)cache.put(request,response.clone());
      return response;
    }).catch(()=>cached);
    return cached||fetchPromise;
  },
  // Network First - для API (Firestore не кэшируем здесь)
  api:async(request)=>{
    try{return await fetch(request);}catch(e){
      return new Response(JSON.stringify({error:'offline'}),{
        status:503,headers:{'Content-Type':'application/json'}
      });
    }
  }
};

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Пропускаем Firestore / Firebase API / Chrome Extension / cross-origin
  if(url.origin!==location.origin||
     url.pathname.startsWith('/__/')||
     url.pathname.startsWith('/firebase/')||
     url.pathname.startsWith('/.well-known/')||
     url.pathname.includes('firestore')||
     url.pathname.includes('googleapis')||
     url.pathname.includes('gstatic')){
    return;
  }
 
  // HTML -> Stale While Revalidate
  if(event.request.mode==='navigate'||
     (event.request.headers.get('accept')||'').includes('text/html')){
    event.respondWith(
      (async()=>{
        const cache=await caches.open(CACHE_NAME);
        return CACHE_STRATEGIES.html(event.request,cache);
      })()
    );
    return;
  }
 
  // Статика (CSS, JS, images, fonts) -> Cache First
  if(url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|woff2?|ico)$/i)){
    event.respondWith(
      (async()=>{
        const cache=await caches.open(CACHE_NAME);
        return CACHE_STRATEGIES.static(event.request,cache);
      })()
    );
    return;
  }
 
  // Остальное -> Network First
  event.respondWith(CACHE_STRATEGIES.api(event.request));
});
 
// Push уведомления (дуэли, напоминания) — опционально
self.addEventListener('push',event=>{
  if(!event.data)return;
  const data=event.data.json();
  const options={
    body:data.body||'',
    icon:data.icon||'/icon-192.png',
    badge:data.badge||'/icon-72.png',
    data:data.url||'/',
    actions:data.actions||[],
    vibrate:[200,100,200]
  };
  event.waitUntil(self.registration.showNotification(data.title||'MTB Skills',options));
});
 
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  if(event.action==='close')return;
  event.waitUntil(clients.openWindow(event.notification.data||'/'));
});
 
// Background Sync для офлайн-операций (дуэли, сохранение прогресса)
self.addEventListener('sync',event=>{
  if(event.tag==='sync-progress'){
    event.waitUntil(
      self.clients.matchAll().then(clients=>{
        clients.forEach(client=>client.postMessage({type:'SYNC_PROGRESS'}));
      })
    );
  }
});
 
// Периодическая очистка кэша (раз в неделю)
setInterval(()=>{
  caches.open(CACHE_NAME).then(cache=>{
    cache.keys().then(keys=>{
      const weekAgo=Date.now()-7*24*60*60*1000;
      keys.forEach(request=>{
        cache.match(request).then(response=>{
          if(response){
            const date=response.headers.get('date');
            if(date&&new Date(date).getTime()<weekAgo)cache.delete(request);
          }
        });
      });
    });
  });
},1000*60*60*24*7);
 
console.log('[SW] MTB Skills Service Worker loaded');
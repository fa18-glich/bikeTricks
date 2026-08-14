importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const CACHE = 'mtb-skills-v9';
const PRECACHE = ['./', './index.html', './manifest.json', './image/icon-192.png', './image/icon-512.png',
  './image/wh-cover.png', './image/wh-step1.jpg', './image/wh-step4.png',
  './image/mn-cover.jpg', './image/mn-step1.jpg', './image/mn-step3.jpg',
  './image/ts-cover.png', './image/ts-step1.jpg', './image/ts-step3.jpg',
  './image/bh-cover.png', './image/bh-step1.jpg',
  './image/st-cover.png', './image/st-step1.jpg'];

// FCM: инициализация и фоновые push-уведомления.
firebase.initializeApp({
  apiKey: 'AIzaSyDPMX7QYJM2_WnTBDfXGw4W_fN3fFCVF6M',
  authDomain: 'mtb-skills-pro-38297.firebaseapp.com',
  projectId: 'mtb-skills-pro-38297',
  storageBucket: 'mtb-skills-pro-38297.appspot.com',
  messagingSenderId: '771638572867',
  appId: '1:771638572867:web:524987af3a428dd553e1f6'
});
if (self.FIREBASE_APPCHECK_DEBUG_TOKEN === undefined && self.location.hostname === 'localhost') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
let msgs = null;
try { msgs = firebase.messaging(); } catch (e) { console.warn('FCM sw init:', e); }
if (msgs) {
  firebase.messaging().onBackgroundMessage((payload) => {
    const d = payload && payload.data ? payload.data : {};
    const title = d.title || 'MTB Skills Pro 🚵‍♂️';
    const body = d.body || '';
    const url = d.click_action || './';
    const tag = d.tag || 'mtb-push';
    const notification = {
      body: body,
      icon: self.location.origin + '/image/icon-192.png',
      badge: self.location.origin + '/image/icon-192.png',
      tag: tag,
      requireInteraction: !!d.requireInteraction,
      data: { url: url }
    };
    self.registration.showNotification(title, notification);
  });
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      for (const c of cs) {
        if ('focus' in c) {
          c.focus();
          if (c.navigate) c.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(new URL(e.request.url).pathname, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // stale-while-revalidate: отдаём кэш мгновенно, фоном обновляем его с сети,
      // при офлайне и отсутствии кэша — запрос проваливается
      const network = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

const CACHE_NAME = 'abhibase-v1';
const STATIC_CACHE = 'abhibase-static-v1';
const DYNAMIC_CACHE = 'abhibase-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/analytics',
  '/dashboard/automations',
  '/dashboard/templates',
  '/dashboard/integrations',
  '/dashboard/branches',
  '/dashboard/settings',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls
  if (url.pathname.startsWith('/api/')) return;

  // Network first for HTML pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) return response;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;

        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  const cache = await caches.open('offline-actions');
  const requests = await cache.keys();

  for (const request of requests) {
    const response = await cache.match(request);
    const body = await response.text();

    await fetch(request, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });

    await cache.delete(request);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'New notification from AbhiBase',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    data: data.url || '/dashboard'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AbhiBase', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

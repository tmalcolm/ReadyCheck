const CACHE_NAME = 'checklist-pwa-v7';
const ASSETS = [
  './',
  './index.html',
  './help.html',
  './manifest.json',
  './css/styles.css',
  './js/cruising-boat-data.js',
  './js/pegasus-boat-data.js',
  './js/storage.js',
  './js/bluetooth-share.js',
  './js/app.js',
  './json/index.json',
  './json/adult_in_charge_checklist.json',
  './json/cruising_boat.json',
  './json/pegasus_aftdeck.json',
  './json/pegasus_foredeck.json',
  './json/pegasus_helm.json',
  './json/pegasus_master_list_all_stations.json',
  './json/pegasus_port_winch.json',
  './json/pegasus_starboard_winch.json',
  './json/scout_in_charge_checklist.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install Event - Pre-cache all essential app assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First for JSON data; Cache First for App Shell
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Network First for JSON checklist definitions
  if (url.pathname.includes('/json/')) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Cache First strategy for app shell assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});


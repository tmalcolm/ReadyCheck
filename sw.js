const CACHE_NAME = 'checklist-pwa-v8';
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

// Message Event - Receive direct cache update from client application
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'UPDATE_CHECKLIST_CACHE') {
    const { filename, data } = e.data;
    if (filename && data) {
      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const baseFilename = filename.replace(/^(\.\/|\/|json\/)+/, '');
      const urlsToCache = [
        `./json/${baseFilename}`,
        `json/${baseFilename}`,
        `/json/${baseFilename}`,
        new URL(`json/${baseFilename}`, self.location.href).href
      ];

      caches.open(CACHE_NAME).then((cache) => {
        return Promise.all(
          urlsToCache.map((url) => {
            const response = new Response(jsonStr, {
              status: 200,
              statusText: 'OK',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': String(new Blob([jsonStr]).size)
              }
            });
            return cache.put(url, response).catch(() => {});
          })
        );
      }).then(() => {
        console.log('[ServiceWorker] Cache successfully updated for:', baseFilename);
      }).catch((err) => {
        console.warn('[ServiceWorker] Failed to update cache:', err);
      });
    }
  }
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
            // Also store under clean path without query parameters
            const cleanUrl = url.origin + url.pathname;
            cache.put(cleanUrl, networkResponse.clone()).catch(() => {});
            const relativePath = '.' + url.pathname;
            cache.put(relativePath, networkResponse.clone()).catch(() => {});
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          const cleanUrl = url.origin + url.pathname;
          return caches.match(cleanUrl, { ignoreSearch: true });
        });
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


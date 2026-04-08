/*
 * Service Worker for spwashi.com
 * Cache-first strategy with periodic update checking
 * Version: 0.0.1
 */

const CACHE_VERSION = 'v0.0.1';
const CACHE_NAME = `spw-cache-${CACHE_VERSION}`;

// Assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/about/index.html',
  '/topics/software/index.html',
  '/play/index.html',
  '/contact/index.html',
  '/public/css/style.css',
  '/public/js/site.js',
  '/public/js/spw-shared.js',
  '/public/js/spw-operators.js',
  '/public/js/spw-console.js',
  '/public/js/frame-navigator.js',
  '/public/js/frame-metrics.js',
  '/public/js/pretext-utils.js',
  '/public/js/pretext-lab.js',
  '/public/js/pwa-update-handler.js'
];

// ─── Install: precache critical assets ───────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Precache failed for some assets:', err);
        // Continue even if precache partially fails
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean up old cache versions ────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch: cache-first with network fallback ─────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        // Cache hit: return cached response
        // Update cache in background (no blocking)
        updateCacheInBackground(request);
        return response;
      }

      // Cache miss: fetch from network
      return fetch(request).then((response) => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response to cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Network failed and no cache: return offline fallback
      return caches.match('/') || new Response('Offline', { status: 503 });
    })
  );
});

// ─── Background update check ───────────────────────────────────────────────

function updateCacheInBackground(request) {
  fetch(request).then((response) => {
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseToCache);
      });
    }
  }).catch(() => {
    // Silently fail; cache is already serving
  });
}

// ─── Version check via manifest ────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    checkForUpdate();
  }
});

function checkForUpdate() {
  fetch('/manifest.webmanifest').then((response) => {
    if (!response.ok) return;
    return response.json();
  }).then((manifest) => {
    const newVersion = manifest.version;
    if (newVersion && newVersion !== CACHE_VERSION) {
      // Notify all clients that an update is available
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            newVersion: newVersion
          });
        });
      });
    }
  }).catch(() => {
    // Silently fail; continue serving from cache
  });
}

/*
 * Root-scoped service worker for spwashi.com
 * Improves offline navigation, installability, update activation, and cache resilience.
 * Strategy:
 * - Precache only shell-critical routes and assets
 * - Cache pages with network-first
 * - Cache same-origin static assets with stale-while-revalidate
 * - Avoid letting decorative or volatile assets poison install stability
 */

const APP_VERSION = '0.2.9';

const CACHE = {
  core: `spw-core-${APP_VERSION}`,
  pages: `spw-pages-${APP_VERSION}`,
  assets: `spw-assets-${APP_VERSION}`,
};

const OFFLINE_URL = '/offline/';
const FALLBACK_IMAGE_URL = '/public/images/icon-192.png';

const CORE_ROUTES = [
  '/',
  '/about',
  '/about/website/',
  '/blog/',
  '/contact',
  '/settings/',
  '/play/',
  '/play/rpg-wednesday/',
  '/play/rpg-wednesday/sessions/',
  '/play/rpg-wednesday/world/',
  '/play/rpg-wednesday/cast/',
  '/play/rpg-wednesday/arcs/',
  '/topics/',
  '/topics/craft/',
  '/topics/craft/fragments/',
  '/topics/craft/svg/',
  '/topics/craft/files/',
  '/topics/software/',
  '/topics/software/spw/',
  '/topics/software/spw/operators/frame/',
  '/topics/software/spw/operators/layer/',
  '/topics/software/spw/operators/baseline/',
  '/topics/software/spw/operators/object/',
  '/topics/software/spw/operators/ref/',
  '/topics/software/spw/operators/probe/',
  '/topics/software/spw/operators/action/',
  '/topics/software/spw/operators/stream/',
  '/topics/software/spw/operators/merge/',
  '/topics/software/spw/operators/binding/',
  '/topics/software/spw/operators/meta/',
  '/topics/software/spw/operators/normalize/',
  '/topics/software/spw/operators/pragma/',
  '/topics/software/spw/operators/surface/',
  OFFLINE_URL,
];

const CORE_ASSETS = [
  '/manifest.webmanifest',

  '/public/css/style.css',
  '/public/css/enhancements.css',

  '/public/js/site.js',
  '/public/js/site-settings.js',
  '/public/js/pwa-update-handler.js',

  '/public/images/apple-touch-icon.png',
  '/public/images/icon-192.png',
  '/public/images/icon-512.png',
  '/public/images/icon-maskable-512.png',
  '/public/images/favicon.svg',
  '/favicon.ico',
];

const PRECACHE_URLS = [...new Set([...CORE_ROUTES, ...CORE_ASSETS])];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE.core);
      const results = await Promise.allSettled(
        PRECACHE_URLS.map((url) => cacheOne(cache, url))
      );

      const failed = results.filter((result) => result.status === 'rejected');

      if (failed.length) {
        console.warn(
          `[SW ${APP_VERSION}] Partial precache failure: ${failed.length}/${PRECACHE_URLS.length}`
        );
      } else {
        console.log(`[SW ${APP_VERSION}] Precache complete`);
      }

      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keep = new Set(Object.values(CACHE));
        const names = await caches.keys();

        await Promise.all(
          names.filter((name) => !keep.has(name)).map((name) => caches.delete(name))
        );

        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.enable();
        }

        await self.clients.claim();
        console.log(`[SW ${APP_VERSION}] Activated`);
      } catch (error) {
        console.warn(`[SW ${APP_VERSION}] Activate failed`, error);
        await self.clients.claim();
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!shouldHandleRequest(request)) return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (isStaticAssetRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(event, request, CACHE.assets));
    return;
  }

  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE.pages));
    return;
  }

  event.respondWith(staleWhileRevalidate(event, request, CACHE.assets));
});

const shouldHandleRequest = (request) => {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return false;
  if (url.protocol !== 'https:' && self.location.protocol === 'https:') return false;

  return true;
};

const isStaticAssetRequest = (request, url) => {
  if (
    ['style', 'script', 'image', 'font', 'audio', 'video'].includes(request.destination)
  ) {
    return true;
  }

  return (
    url.pathname.startsWith('/public/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  );
};

const cacheOne = async (cache, url) => {
  const request = new Request(url, { credentials: 'same-origin' });
  const response = await fetch(request);

  if (!response.ok) {
    throw new Error(`Failed to precache ${url}: ${response.status}`);
  }

  await cache.put(request, response);
};

const handleNavigationRequest = async (event) => {
  try {
    const preloadResponse = await event.preloadResponse;

    if (preloadResponse && preloadResponse.ok) {
      event.waitUntil(cacheResponse(CACHE.pages, event.request, preloadResponse.clone()));
      return preloadResponse;
    }

    const response = await fetch(event.request);

    if (response && response.ok) {
      event.waitUntil(cacheResponse(CACHE.pages, event.request, response.clone()));
    }

    return response;
  } catch {
    const cached = await matchNavigationCache(event.request);
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    return (
      offline ||
      new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
};

const networkFirst = async (request, cacheName) => {
  try {
    const response = await fetch(request);

    if (response && response.ok) {
      await cacheResponse(cacheName, request, response.clone());
    }

    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.destination === 'document') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }

    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
};

const staleWhileRevalidate = async (event, request, cacheName) => {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const networkPromise = fetch(request)
      .then(async (response) => {
        if (response && response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => null);

    if (cachedResponse) {
      event.waitUntil(networkPromise);
      return cachedResponse;
    }

    const networkResponse = await networkPromise;
    if (networkResponse) return networkResponse;

    if (request.destination === 'image') {
      const fallback = await caches.match(FALLBACK_IMAGE_URL);
      if (fallback) return fallback;
    }

    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
};

const cacheResponse = async (cacheName, request, response) => {
  if (!response || !response.ok) return;

  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch (error) {
    console.warn(`[SW ${APP_VERSION}] Cache put failed`, error);
  }
};

const matchNavigationCache = async (request) => {
  try {
    const url = new URL(request.url);
    const candidates = buildNavigationCandidates(url);

    for (const candidate of candidates) {
      const cached = await caches.match(candidate);
      if (cached) return cached;
    }
  } catch {}

  return null;
};

const buildNavigationCandidates = (url) => {
  const pathname = url.pathname;
  const trimmedPath = trimIndexAndTrailingSlash(pathname);
  const candidates = new Set([pathname, trimmedPath]);

  if (trimmedPath === '/') {
    candidates.add('/');
    candidates.add('/index.html');
    return [...candidates];
  }

  candidates.add(`${trimmedPath}/`);
  candidates.add(`${trimmedPath}/index.html`);
  candidates.add(`${pathname.replace(/\/$/, '')}/index.html`);

  return [...candidates];
};

const trimIndexAndTrailingSlash = (pathname) => {
  const withoutIndex = pathname.replace(/index\.html$/, '');
  const trimmed = withoutIndex.replace(/\/+$/, '');
  return trimmed || '/';
};

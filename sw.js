/*
 * Root-scoped service worker for spwashi.com
 * Improves offline navigation, installability, and update activation.
 */

const APP_VERSION = '0.2.2';
const CORE_CACHE_NAME = `spw-core-${APP_VERSION}`;
const PAGE_CACHE_NAME = `spw-pages-${APP_VERSION}`;
const ASSET_CACHE_NAME = `spw-assets-${APP_VERSION}`;
const OFFLINE_URL = '/offline/';

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
  OFFLINE_URL
];

const CORE_ASSETS = [
  '/manifest.webmanifest',
  '/public/css/style.css',
  '/public/css/enhancements.css',
  '/public/css/svg-surfaces.css',
  '/public/css/craft-surface.css',
  '/public/css/blog-surface.css',
  '/public/data/media-focus.json',
  '/public/js/site.js',
  '/public/js/site-settings.js',
  '/public/js/media-publishing.js',
  '/public/js/blog-interpreter.js',
  '/public/js/blog-specimens.js',
  '/public/js/attn-register.js',
  '/public/js/spw-shared.js',
  '/public/js/spw-operators.js',
  '/public/js/spw-console.js',
  '/public/js/frame-navigator.js',
  '/public/js/frame-metrics.js',
  '/public/js/pretext-utils.js',
  '/public/js/pretext-lab.js',
  '/public/js/rpg-wednesday.js',
  '/public/js/pwa-update-handler.js',
  '/public/js/spw-component-semantics.js',
  '/public/images/apple-touch-icon.png',
  '/public/images/icon-192.png',
  '/public/images/icon-512.png',
  '/public/images/icon-maskable-512.png',
  '/public/images/favicon.svg',
  '/favicon.ico'
];

const PRECACHE_URLS = [...CORE_ROUTES, ...CORE_ASSETS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([CORE_CACHE_NAME, PAGE_CACHE_NAME, ASSET_CACHE_NAME]);
    const names = await caches.keys();

    await Promise.all(
      names
        .filter((name) => !keep.has(name))
        .map((name) => caches.delete(name))
    );

    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, PAGE_CACHE_NAME));
    return;
  }

  event.respondWith(staleWhileRevalidate(event, request, ASSET_CACHE_NAME));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const handleNavigationRequest = async (event) => {
  const preloadResponse = await event.preloadResponse;
  if (preloadResponse) {
    event.waitUntil(cachePage(event.request, preloadResponse.clone()));
    return preloadResponse;
  }

  try {
    const response = await fetch(event.request);
    event.waitUntil(cachePage(event.request, response.clone()));
    return response;
  } catch (error) {
    const cachedResponse = await matchNavigationCache(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return caches.match(OFFLINE_URL);
  }
};

const networkFirst = async (request, cacheName) => {
  try {
    const response = await fetch(request);
    await cacheResponse(cacheName, request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.destination === 'document') {
      return caches.match(OFFLINE_URL);
    }

    return new Response('Offline', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
};

const staleWhileRevalidate = async (event, request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      await cacheResponse(cacheName, request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    event.waitUntil(networkPromise);
    return cachedResponse;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  if (request.destination === 'image') {
    const fallbackIcon = await caches.match('/public/images/icon-192.png');
    if (fallbackIcon) {
      return fallbackIcon;
    }
  }

  return new Response('Offline', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};

const cachePage = async (request, response) => {
  await cacheResponse(PAGE_CACHE_NAME, request, response);
};

const cacheResponse = async (cacheName, request, response) => {
  if (!response.ok) {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response);
};

const matchNavigationCache = async (request) => {
  const candidates = buildNavigationCandidates(new URL(request.url));

  for (const candidate of candidates) {
    const cachedResponse = await caches.match(candidate);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  return null;
};

const buildNavigationCandidates = (url) => {
  const candidates = new Set([url.pathname]);
  const trimmedPath = trimIndexAndTrailingSlash(url.pathname);

  if (trimmedPath === '/') {
    candidates.add('/');
    candidates.add('/index.html');
    return [...candidates];
  }

  candidates.add(trimmedPath);
  candidates.add(`${trimmedPath}/`);
  candidates.add(`${trimmedPath}/index.html`);
  candidates.add(`${url.pathname.replace(/\/$/, '')}/index.html`);

  return [...candidates];
};

const trimIndexAndTrailingSlash = (pathname) => {
  const withoutIndex = pathname.replace(/index\.html$/, '');
  const trimmed = withoutIndex.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

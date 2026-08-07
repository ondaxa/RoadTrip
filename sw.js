/* Route Log service worker.
   Point of this file: the day you are actually driving is the day you have no signal.
   Everything the app needs to render your plan is cached, and map tiles, routes and
   forecasts you have already looked at keep working with the phone in airplane mode.  */

const VERSION   = 'routelog-v1';
const SHELL     = `${VERSION}-shell`;   // the app itself
const TILES     = `${VERSION}-tiles`;   // OpenStreetMap imagery
const DATA      = `${VERSION}-data`;    // routing, geocoding, weather

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/leaflet/images/layers.png',
  './vendor/leaflet/images/layers-2x.png'
];

const MAX_TILES = 1200;   // roughly a few hundred MB of country-level browsing
const MAX_DATA  = 400;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // addAll fails the whole install if any one request fails, so add them one at a time
    await Promise.all(SHELL_URLS.map(async url => {
      try { await cache.add(new Request(url, { cache: 'reload' })); } catch (e) { /* offline at install */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL, TILES, DATA];
    const names = await caches.keys();
    await Promise.all(names.filter(n => !keep.includes(n)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  // oldest first — Cache Storage keeps insertion order
  await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
}

/* Imagery never changes for a given tile URL, so serve from cache and only
   reach the network on a miss. */
async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && (res.ok || res.type === 'opaque')) {
    cache.put(request, res.clone());
    if (max) trim(cacheName, max);
  }
  return res;
}

/* Routes, geocoding and forecasts should be fresh when there's signal and
   fall back to the last known answer when there isn't. */
async function networkFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
      if (max) trim(cacheName, max);
    }
    return res;
  } catch (e) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw e;
  }
}

/* The app itself: serve instantly from cache, refresh quietly in the background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const net = fetch(request).then(res => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return hit || net || fetch(request);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const host = url.hostname;

  // navigations always resolve to the app, online or off
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch (e) {
        const cache = await caches.open(SHELL);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  if (host.endsWith('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(req, TILES, MAX_TILES));
    return;
  }
  if (host === 'cdnjs.cloudflare.com' || host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(req, SHELL));
    return;
  }
  if (host.indexOf('router.project-osrm.org') >= 0 ||
      host.indexOf('nominatim.openstreetmap.org') >= 0 ||
      host.indexOf('open-meteo.com') >= 0 ||
      host.indexOf('api.mapbox.com') >= 0) {
    event.respondWith(networkFirst(req, DATA, MAX_DATA));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, SHELL));
  }
});

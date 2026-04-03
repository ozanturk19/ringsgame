// Service Worker — Halka Oyunu
// Cache-first for static assets, network-first for HTML

const CACHE = 'halka-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // HTML — network first, fall back to cache
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  // Static assets — cache first
  if (url.pathname.match(/\.(js|css|png|svg|woff2?)$/)) {
    e.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return resp
        })
        return cached || networkFetch
      })
    )
  }
})

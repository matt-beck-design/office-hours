const CACHE = 'office-hours-v1'
const DIGEST_CACHE = 'office-hours-digest-v1'

// Static shell assets to precache
const SHELL = ['/', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== DIGEST_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Cache digest API response for offline fallback
  if (url.pathname === '/api/digest') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(DIGEST_CACHE).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Navigation: serve app shell, fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request))
  )
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'Office Hours', body: event.data.text() } }

  const { title = 'Office Hours', body = '', url = '/' } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})

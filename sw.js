const CACHE_NAME = 'kalakar-pwa-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    // Placeholder images used in the mock feed
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1533750516457-47f0171bb3ee?auto=format&fit=crop&w=800&q=80',
    'https://i.pravatar.cc/150?img=11',
    'https://i.pravatar.cc/150?img=1'
];

// Install Event: Pre-cache the application shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching Application Shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event: Clean up old caches if the version changes
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => {
                    console.log('[Service Worker] Deleting old cache:', name);
                    return caches.delete(name);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Implement Cache-First Strategy with Network Fallback
self.addEventListener('fetch', event => {
    // We only cache GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise hit the network
            return fetch(event.request).then(networkResponse => {
                // If the request was valid, cache it for future offline use
                // Note: we check if it is a valid 200 response and of type 'basic' or 'cors'
                if (!networkResponse || networkResponse.status !== 200 ||
                    (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    // Avoid caching analytics or tracking scripts if any existed
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(error => {
                console.log('[Service Worker] Fetch failed, returning offline fallback.', error);
                // If we had a dedicated offline.html, we would return it here.
                // For a single page app, the root '/' cache serves as the fallback.
            });
        })
    );
});

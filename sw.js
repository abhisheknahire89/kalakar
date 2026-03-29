const CACHE_NAME = 'kalakar-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/js/components/core.js',
    '/js/components/feed.js',
    '/js/components/jobs.js',
    '/js/components/network.js',
    '/js/components/chat.js',
    '/js/components/videoPlayer.js',
    '/js/components/postComposer.js',
    '/js/components/vouchModal.js',
    '/js/components/kanban.js',
    '/js/components/contractBuilder.js',
    '/js/components/notifications.js',
    '/js/components/search.js',
    '/js/components/settings.js',
    '/js/components/toast.js',
    '/js/components/skeleton.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Offline-first strategy
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

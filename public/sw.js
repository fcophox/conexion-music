// Service worker for PWA installation and basic offline capability
const CACHE_NAME = 'conexion-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler is required by some browsers for installation
  event.respondWith(fetch(event.request));
});

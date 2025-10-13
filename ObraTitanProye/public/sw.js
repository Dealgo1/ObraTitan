// =========================================
// ⚙️ Service Worker — ObraTitan
// =========================================

const CACHE_NAME = 'obra-titan-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo-192.png',
  '/logo-512.png',
  '/vite.svg'
];

// =========================================
// 🛠️ INSTALACIÓN
// =========================================
self.addEventListener('install', (event) => {
  console.log('🛠️ Instalando Service Worker...');

  // Abre la caché y agrega los archivos definidos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );

  // Obliga al navegador a activar el SW sin esperar
  self.skipWaiting();
});

// =========================================
// 🚀 ACTIVACIÓN
// =========================================
self.addEventListener('activate', (event) => {
  console.log('🚀 Activando Service Worker...');

  // Elimina todas las cachés antiguas que no coincidan con la actual
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('🧹 Borrando caché antigua:', name);
            return caches.delete(name);
          }
        })
      )
    )
  );

  // Toma control inmediato sobre todas las pestañas abiertas
  self.clients.claim();
});

// =========================================
// 🌐 INTERCEPTAR PETICIONES (FETCH EVENT)
// =========================================
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el recurso está en caché, devuélvelo directamente
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está en caché, intenta obtenerlo de la red
      return fetch(event.request)
        .then((networkResponse) => {
          // Guarda una copia en caché para futuras visitas
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Si no hay conexión y la solicitud es de navegación (HTML),
          // muestra la página offline (index.html)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

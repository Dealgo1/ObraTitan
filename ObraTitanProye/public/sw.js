// =========================================
// ⚙️ Service Worker — ObraTitan (seguro)
// =========================================

const CACHE_NAME = 'obra-titan-cache-v8';
const URLS_TO_CACHE = [
  '/', '/index.html', '/manifest.webmanifest',
  '/logo-192.png', '/logo-512.png', '/vite.svg'
];

// Rutas/hosts que NUNCA debe interceptar (HMR, herramientas, etc.)
const NEVER_INTERCEPT_PATHS = [
  '/@vite', '/@react-refresh', '/__vite_ping', '/__vite'
];

// Utilidad: ¿es http(s)?
const isHttp = (url) => url.protocol === 'http:' || url.protocol === 'https:';

// =========================================
// 🛠️ INSTALACIÓN
// =========================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// =========================================
// 🚀 ACTIVACIÓN
// =========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : undefined)))
    )
  );
  self.clients.claim();
});

// =========================================
// 🌐 INTERCEPTAR PETICIONES
// =========================================
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Solo GET es cacheable
  if (req.method !== 'GET') return;

  // 2) Evitar bug: only-if-cached + cross-origin
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;

  const url = new URL(req.url);

  // 3) Ignorar esquemas no http(s): chrome-extension, ws, wss, data, blob…
  if (!isHttp(url)) return;

  // 4) No interceptar rutas internas de Vite/HMR u otras herramientas
  if (NEVER_INTERCEPT_PATHS.some((p) => url.pathname.startsWith(p))) return;

  // 5) En desarrollo (localhost:5173) no interceptes nada del dev server
  if (url.hostname === 'localhost' && url.port === '5173') return;

  // 6) Política: solo cachear mismo origen (evita hotjar/terceros y respuestas opacas)
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return; // Deja pasar a la red sin interceptar

  // Estrategia: cache-first con actualización en segundo plano
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) {
      // Actualiza en background (no bloquea la respuesta)
      fetch(req).then((resp) => {
        if (resp && resp.ok && resp.type === 'basic') {
          cache.put(req, resp.clone()).catch(() => {});
        }
      }).catch(() => {});
      return cached;
    }

    try {
      const resp = await fetch(req);
      if (resp && resp.ok && resp.type === 'basic') {
        cache.put(req, resp.clone()).catch(() => {});
      }
      return resp;
    } catch (err) {
      // Fallback para navegación cuando no hay red
      if (req.mode === 'navigate' || (req.destination === 'document')) {
        const offline = await cache.match('/index.html');
        if (offline) return offline;
      }
      throw err;
    }
  })());
});

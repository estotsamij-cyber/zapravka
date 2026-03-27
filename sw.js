const CACHE_NAME = 'fuel-calculator-v2.3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кеш открыт');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Некоторые файлы не закешированы (это норма если icon.png на GitHub):', err);
          // Не падаем если icon не найден
          return cache.addAll(urlsToCache.filter(url => url !== './icon.png'));
        });
      })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаляю старый кеш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если в кеше - берём оттуда
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Если это не успешный ответ
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Клонируем response
          const responseToCache = response.clone();

          // Кешируем успешные запросы
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Оффлайн режим - возвращаем кешированную версию или ошибку
        return caches.match(event.request);
      })
  );
});

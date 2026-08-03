// Versão do cache atualizada para forçar a limpeza de cache antigo nos celulares
const CACHE_NAME = 'stravion-v3';

// Lista de arquivos essenciais para o PWA funcionar offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// Evento de Instalação: Armazena os arquivos no cache e ativa imediatamente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Stravion PWA: Armazenando arquivos atualizados em cache offline...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Evento de Ativação: Apaga caches de versões anteriores (v1, v2, etc.)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Stravion PWA: Removendo versão antiga do cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia Network-First: Busca a versão nova no servidor Vercel primeiro.
// Se houver internet, atualiza a tela e o cache. Se estiver offline, usa a versão do cache.
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Quando estiver completamente offline, busca do cache ou cai no index.html
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});

// Evento de Notificação Push (Alertas do Servidor / Local)
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Stravion Fitness',
    body: 'Você tem um novo lembrete ou treino pendente!',
    icon: './favicon.svg'
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon || './favicon.svg',
      vibrate: [200, 100, 200],
      data: { url: './' }
    })
  );
});

// Evento ao Clicar na Notificação: Abre ou foca a aba do aplicativo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

// Evento de Sincronização em Segundo Plano (Background Sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workouts') {
    console.log('Stravion SW: Executando Sincronização em Segundo Plano (Background Sync)...');
    event.waitUntil(
      Promise.resolve()
    );
  }
});

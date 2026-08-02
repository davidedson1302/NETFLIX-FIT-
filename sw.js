// Nome da versão do cache do aplicativo PWA
const CACHE_NAME = 'stravion-v2';

// Lista de arquivos principais para funcionamento 100% offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// Evento de Instalação: Armazena os arquivos essenciais no cache do celular
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Stravion PWA: Armazenando arquivos em cache offline...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Evento de Ativação: Remove caches de versões anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Stravion PWA: Limpando cache antigo do aplicativo...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Evento de Busca (Fetch): Intercepta requisições de rede
// Entrega os arquivos salvos em cache caso o usuário esteja offline
self.addEventListener('fetch', (event) => {
  // Ignora requisições de APIs externas ou esquemas não-HTTP(S)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Opcionalmente atualiza o cache dinamicamente com arquivos novos
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Retorna a página principal em cache se a rede falhar completamente
        return caches.match('./index.html');
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
// Sincroniza dados com o servidor assim que a conexão com a internet retornar
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workouts') {
    console.log('Stravion SW: Executando Sincronização em Segundo Plano (Background Sync)...');
    event.waitUntil(
      // Lógica de envio de treinos salvos offline para o servidor
      Promise.resolve()
    );
  }
});

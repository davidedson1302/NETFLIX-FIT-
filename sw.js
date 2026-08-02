// Nome da versão do cache
const CACHE_NAME = 'stravion-v1';

// Arquivos principais que serão salvos para uso offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Evento de Instalação: Salva os arquivos no cache do celular
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Stravion PWA: Armazenando arquivos em cache offline...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Evento de Ativação: Limpa caches antigos se houver atualização
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Stravion PWA: Limpando cache antigo...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Evento de Busca: Intercepta requisições e entrega do cache se estiver offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
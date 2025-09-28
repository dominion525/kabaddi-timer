// Kabaddi Timer - 最小限のService Worker
// PWA認識のための最低限の実装（キャッシュ機能なし）

const CACHE_VERSION = 'v1';

// Service Worker インストール
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  // 即座にアクティベート
  self.skipWaiting();
});

// Service Worker アクティベート
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  // 全クライアントをコントロール
  event.waitUntil(self.clients.claim());
});

// フェッチイベント - 何もせずにネットワークに転送
self.addEventListener('fetch', (event) => {
  // WebSocket接続は処理しない
  if (event.request.headers.get('upgrade') === 'websocket') {
    return;
  }

  // すべてのリクエストをネットワークに転送（キャッシュなし）
  event.respondWith(fetch(event.request));
});
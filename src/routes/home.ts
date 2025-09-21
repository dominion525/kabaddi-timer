import { Hono } from 'hono';
import { homeAppScript } from '../client/home-app';

const homeRouter = new Hono();

homeRouter.get('/', async (c) => {
  // Cloudflare Workers環境では直接HTMLを返す（将来的にはテンプレートエンジンを使用）
  // フォールバック：基本的なHTMLを返す
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>カバディタイマー</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">カバディタイマー</h1>
        <p class="text-gray-600 mb-8">テンプレートの読み込みに失敗しました</p>
        <button onclick="location.href='/game/test'" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
          テストゲームを開始
        </button>
      </div>
      <script>
${homeAppScript}
      </script>
    </body>
    </html>
  `);
});

export default homeRouter;
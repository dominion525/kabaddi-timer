import { Hono } from 'hono';
import { Env } from '../types/game';

const gameV2Router = new Hono<{ Bindings: Env }>();

gameV2Router.get('/game-v2/:gameId', async (c) => {
  const gameId = c.req.param('gameId');

  if (!gameId) {
    return c.text('Game ID is required', 400);
  }

  // セキュリティバリデーション
  const safePattern = /^[a-zA-Z0-9-]+$/;
  const maxLength = 50;

  if (!safePattern.test(gameId) || gameId.length > maxLength) {
    return c.text('Invalid game ID format', 400);
  }

  // パストラバーサルのチェック
  if (gameId.includes('..') || gameId.includes('//')) {
    return c.text('Invalid game ID', 400);
  }

  // シンプルなHTML（動的生成）
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game V2 - ${gameId}</title>

  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json">

  <!-- PWA Meta Tags -->
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="apple-mobile-web-app-title" content="Kabaddi Timer">
  <meta name="application-name" content="Kabaddi Timer">
  <meta name="theme-color" content="#000000">
  <meta name="description" content="カバディ用リアルタイムタイマー・スコアボード">

  <!-- App Icons -->
  <link rel="apple-touch-icon" href="/images/kabaddi-timer-app-icon-192.png">
  <link rel="apple-touch-icon" sizes="192x192" href="/images/kabaddi-timer-app-icon-192.png">

  <!-- Favicon -->
  <link rel="icon" href="/images/favicon.ico" type="image/x-icon">
  <link rel="shortcut icon" href="/images/favicon.ico" type="image/x-icon">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
  <script src="https://unpkg.com/qrious@4.0.2/dist/qrious.min.js"></script>
</head>
<body>
  <div id="app" data-game-id="${gameId}"></div>
  <script src="/js/game-v2.js"></script>
</body>
</html>`;

  return c.html(html);
});

export default gameV2Router;
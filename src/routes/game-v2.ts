import { Hono } from 'hono';
import { Env } from '../types/game';

// リビジョン情報を取得する関数
function getRevision(): string {
  try {
    const revisionData = require('../revision.json');
    return revisionData.revision || 'unknown';
  } catch (error) {
    // ファイルが存在しない場合はunknownを返す
    return 'unknown';
  }
}

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

  // リビジョン情報を取得
  const revision = getRevision();

  // シンプルなHTML（動的生成）
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0">
  <title>Game V2 - ${gameId}</title>

  <!-- リビジョン情報をグローバル変数として注入 -->
  <script>window.APP_REVISION = '${revision}';</script>

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

  <!-- Tailwind CSS -->
  <link rel="stylesheet" href="/js/style.css">

  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
  <script src="https://unpkg.com/qrious@4.0.2/dist/qrious.min.js"></script>
  <style>
    html, body {
      overflow-x: hidden;
      max-width: 100vw;
      overflow-y: hidden;
      height: 100vh;
      max-height: 100vh;
      overscroll-behavior: none;
      position: fixed;
      width: 100%;
    }

    body {
      touch-action: manipulation;
    }
  </style>
</head>
<body>
  <div id="app" data-game-id="${gameId}"></div>
  <script src="/js/game-v2.js"></script>
</body>
</html>`;

  return c.html(html);
});

export default gameV2Router;
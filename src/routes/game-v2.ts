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
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app" data-game-id="${gameId}"></div>
  <script src="/js/game-v2.js"></script>
</body>
</html>`;

  return c.html(html);
});

export default gameV2Router;
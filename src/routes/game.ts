import { Hono } from 'hono';
import { Env } from '../types/game';
import { gameTemplate } from '../templates/game-template';

const gameRouter = new Hono<{ Bindings: Env }>();

gameRouter.get('/game/:gameId', async (c) => {
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

  // シンプルなHTMLレンダリング（外部スクリプトを使用）
  const html = gameTemplate.replace(/\{\{gameId\}\}/g, gameId);

  return c.html(html);
});

export default gameRouter;
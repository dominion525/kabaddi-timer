import { Hono } from 'hono';
import { Env } from '../types/game';
import { gameAppScript } from '../client/game-app';
import { timerLogicScript } from '../client/timer-logic';
import { browserAPIsScript } from '../client/browser-apis';
import { uiStateScript } from '../client/ui-state';
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

  // 完全なゲームテンプレートを使用
  // スクリプト読み込み順序: browser-apis → ui-state → timer-logic → game-app
  const allScripts = [
    browserAPIsScript,
    uiStateScript,
    timerLogicScript,
    gameAppScript
  ].join('\n');

  const html = gameTemplate
    .replace(/\{\{gameId\}\}/g, gameId)
    .replace('{{gameAppScript}}', allScripts);

  return c.html(html);
});

export default gameRouter;
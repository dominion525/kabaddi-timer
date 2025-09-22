import { Hono } from 'hono';
import { Env } from '../types/game';
import { gameAppScript } from '../client/game-app';
import { timerLogicScript } from '../client/timer-logic';
import { browserAPIsScript } from '../client/browser-apis';
import { uiStateScript } from '../client/ui-state';
import { inputFieldsScript } from '../client/input-fields';
/* eslint-disable-next-line */
// @ts-ignore - Used in allScripts array
import { constantsScript } from '../client/constants';
/* eslint-disable-next-line */
// @ts-ignore - Used in allScripts array
import { actionCreatorsScript } from '../client/action-creators';
/* eslint-disable-next-line */
// @ts-ignore - Used in allScripts array
import { scoreLogicScript } from '../client/score-logic';
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
  // スクリプト読み込み順序: browser-apis → constants → action-creators → score-logic → ui-state → input-fields → timer-logic → game-app
  const allScripts = [
    browserAPIsScript,
    constantsScript,
    actionCreatorsScript,
    scoreLogicScript,
    uiStateScript,
    inputFieldsScript,
    timerLogicScript,
    gameAppScript
  ].join('\n');

  const html = gameTemplate
    .replace(/\{\{gameId\}\}/g, gameId)
    .replace('{{gameAppScript}}', allScripts);

  return c.html(html);
});

export default gameRouter;
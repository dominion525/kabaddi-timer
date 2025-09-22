import gameHTML from './game.html';

export function gameTemplate(gameId: string, env?: any): string {
  // 環境変数によるJavaScript読み込み切り替え
  const isProd = env?.NODE_ENV === 'production' || env?.ENVIRONMENT === 'production';

  let jsIncludes: string;
  if (isProd) {
    // 本番環境: バンドルファイル
    jsIncludes = '<script src="/js/bundle.min.js"></script>';
  } else {
    // 開発環境: 個別ファイル
    jsIncludes = `
  <script src="/js/browser-apis.js"></script>
  <script src="/js/constants.js"></script>
  <script src="/js/action-creators.js"></script>
  <script src="/js/score-logic.js"></script>
  <script src="/js/websocket-manager.js"></script>
  <script src="/js/ui-state.js"></script>
  <script src="/js/input-fields.js"></script>
  <script src="/js/timer-logic.js"></script>
  <script src="/js/game-app.js"></script>`;
  }

  return gameHTML
    .replace(/{{gameId}}/g, gameId)
    .replace('{{JS_INCLUDES}}', jsIncludes);
}
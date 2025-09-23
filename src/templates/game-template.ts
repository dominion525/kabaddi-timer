// HTMLパーツを静的インポート
import headContent from './partials/head.html';
import desktopContent from './partials/desktop.html';
import mobileContent from './partials/mobile.html';
import modalsContent from './partials/modals.html';
import scriptsContent from './partials/scripts.html';

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

/**
 * HTMLテンプレートの各パーツを結合する
 */
function buildGameTemplate(): string {
  const combinedHtml = [
    headContent,
    desktopContent,
    mobileContent,
    modalsContent,
    scriptsContent
  ].join('\n');

  return combinedHtml;
}

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

  // リビジョン情報を取得
  const revision = getRevision();

  // 分離されたパーツから動的にテンプレートを構築
  const gameHTML = buildGameTemplate();

  return gameHTML
    .replace(/{{gameId}}/g, gameId)
    .replace('{{JS_INCLUDES}}', jsIncludes)
    .replace(/{{REVISION}}/g, revision);
}
// クライアントサイドJavaScriptのバンドルエントリーポイント
// 依存順序に注意して読み込み

// 基盤ライブラリ
import './components/browser-apis';
import './components/constants';
import './components/action-creators';
import './components/score-logic';
import './components/timer-logic';
import './components/ui-state';
import './components/input-fields';

// メインアプリケーション（最後に読み込み）
import './components/game-app';
import './components/home-app';
import './components/qr-modal';
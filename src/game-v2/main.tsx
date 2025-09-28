import { render } from 'preact';
import { App } from './components/App';

// DOMが読み込まれてから実行
if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}

function init() {
  const app = document.getElementById('app');
  const gameId = app?.dataset.gameId || 'test';

  render(<App gameId={gameId} />, app!);

  // Lucide アイコンを初期化
  if (typeof (window as any).lucide !== 'undefined') {
    (window as any).lucide.createIcons();
  }
}
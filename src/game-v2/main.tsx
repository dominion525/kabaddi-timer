import { render } from 'preact';
import { App } from './components/App';
import '../styles/tailwind.css';

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
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
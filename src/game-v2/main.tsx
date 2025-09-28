import { render } from 'preact';
import { HelloWorld } from './components/HelloWorld';

// DOMが読み込まれてから実行
if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}

function init() {
  const app = document.getElementById('app');
  const gameId = app?.dataset.gameId || 'test';

  render(<HelloWorld gameId={gameId} />, app!);
}
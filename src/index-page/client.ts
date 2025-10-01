/**
 * Index page client-side JavaScript bundle
 * Minimal interactions for static page (~2KB gzip target)
 */

import { generateShortId, validateGameId } from './utils/gameId';

// Lucide icons初期化（TypeScript型定義なし）
declare const lucide: {
  createIcons: () => void;
} | undefined;

/**
 * 新しいタイマーを作成
 */
function createNewTimer(): void {
  const timerId = generateShortId();
  window.location.href = `/game/${encodeURIComponent(timerId)}`;
}

/**
 * 既存タイマーに移動
 */
function goToTimer(): void {
  const input = document.getElementById('timerIdInput') as HTMLInputElement | null;
  if (!input) {
    console.error('timerIdInput element not found');
    return;
  }

  const timerId = input.value.trim();
  const validation = validateGameId(timerId);

  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  // URLエンコーディングして安全に遷移
  window.location.href = `/game/${encodeURIComponent(timerId)}`;
}

/**
 * クレジットモーダルを開く
 */
function openCreditsModal(): void {
  const modal = document.getElementById('creditsModal');
  if (modal) {
    modal.classList.remove('hidden');
    // Lucideアイコンの初期化
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

/**
 * クレジットモーダルを閉じる
 */
function closeCreditsModal(): void {
  const modal = document.getElementById('creditsModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
  // Enterキーでタイマーへ移動
  const input = document.getElementById('timerIdInput') as HTMLInputElement | null;
  if (input) {
    input.addEventListener('keypress', function(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        goToTimer();
      }
    });
  }

  // Lucide Iconsを初期化
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // クレジットモーダルのESCキーと背景クリックハンドラー
  const modal = document.getElementById('creditsModal');
  if (modal) {
    // ESCキーで閉じる
    document.addEventListener('keydown', function(e: KeyboardEvent) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeCreditsModal();
      }
    });

    // 背景クリックで閉じる
    modal.addEventListener('click', function(e: MouseEvent) {
      if (e.target === modal) {
        closeCreditsModal();
      }
    });

    // 閉じるボタンのクリックハンドラー
    const closeBtn = document.getElementById('creditsModalCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCreditsModal);
    }
  }
});

// グローバル関数として公開（HTML onclick属性から呼び出すため）
(window as any).createNewTimer = createNewTimer;
(window as any).goToTimer = goToTimer;
(window as any).openCreditsModal = openCreditsModal;
(window as any).closeCreditsModal = closeCreditsModal;

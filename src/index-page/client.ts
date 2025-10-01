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
 * 技術情報モーダルを開く
 */
function openTechModal(): void {
  const modal = document.getElementById('techModal');
  if (modal) {
    modal.classList.remove('hidden');
    // Lucide icons in modal
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

/**
 * 技術情報モーダルを閉じる
 */
function closeTechModal(): void {
  const modal = document.getElementById('techModal');
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
});

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', function(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeTechModal();
  }
});

// モーダル背景クリックで閉じる
const techModal = document.getElementById('techModal');
if (techModal) {
  techModal.addEventListener('click', function(e: MouseEvent) {
    if (e.target === techModal) {
      closeTechModal();
    }
  });
}

// グローバル関数として公開（HTML onclick属性から呼び出すため）
(window as any).createNewTimer = createNewTimer;
(window as any).goToTimer = goToTimer;
(window as any).openTechModal = openTechModal;
(window as any).closeTechModal = closeTechModal;

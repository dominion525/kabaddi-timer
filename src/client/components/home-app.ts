export const homeAppScript = `
// ホームページのJavaScript機能

// Base36エンコーディング関数
function base36Encode(num) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  while (num > 0) {
    result = chars[num % 36] + result;
    num = Math.floor(num / 36);
  }
  return result || '0';
}

// UUIDからショートIDを生成
function generateShortId() {
  const uuid = crypto.randomUUID();
  // UUIDの一部を数値に変換
  const hex = uuid.replace(/-/g, '').substring(0, 12);
  const num = parseInt(hex, 16);
  // Base36で5-6文字のIDに変換
  const shortId = base36Encode(num).substring(0, 6);
  return shortId.length >= 5 ? shortId : shortId.padStart(5, '0');
}

// 新しいタイマーを作成
function createNewTimer() {
  const timerId = generateShortId();
  window.location.href = \`/game/\${encodeURIComponent(timerId)}\`;
}

// 既存タイマーに移動
function goToTimer() {
  const input = document.getElementById('timerIdInput');
  const timerId = input.value.trim();

  if (!timerId) {
    alert('タイマーIDを入力してください');
    return;
  }

  // セキュリティバリデーション
  const safePattern = /^[a-zA-Z0-9-]+$/;
  const maxLength = 50;

  if (!safePattern.test(timerId)) {
    alert('タイマーIDは英数字とハイフンのみ使用できます');
    return;
  }

  if (timerId.length > maxLength) {
    alert('タイマーIDが長すぎます（最大50文字）');
    return;
  }

  // パストラバーサルのチェック
  if (timerId.includes('..') || timerId.includes('//')) {
    alert('不正なタイマーIDです');
    return;
  }

  // URLエンコーディングして安全に遷移
  window.location.href = \`/game/\${encodeURIComponent(timerId)}\`;
}

// Enterキーでタイマーへ移動
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('timerIdInput');
  if (input) {
    input.addEventListener('keypress', function(e) {
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
`;
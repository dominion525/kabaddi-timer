export const qrModalScript = `
// QRモーダル関連の関数群

window.openQRModal = function() {
  const constants = window.Constants;
  const gameUrl = window.location.href;
  const modal = document.getElementById(constants.UI_ELEMENTS.qrModal);
  const canvas = document.getElementById(constants.UI_ELEMENTS.qrCanvas);
  const gameIdElement = document.getElementById(constants.UI_ELEMENTS.modalGameId);
  const urlDisplay = document.getElementById(constants.UI_ELEMENTS.urlDisplay);

  // ゲームIDを表示
  const gameId = window.location.pathname.split('/').pop();
  gameIdElement.textContent = gameId;

  // URLを表示
  urlDisplay.textContent = gameUrl;

  // QRコードを生成
  try {
    if (typeof QRious !== 'undefined') {
      const qr = new QRious({
        element: canvas,
        value: gameUrl,
        size: 200,
        level: 'M'
      });
      console.log('QRコード生成成功');
    } else {
      console.error('QRiousライブラリが読み込まれていません');
      // フォールバック表示
      showQRFallback(canvas);
    }
  } catch (error) {
    console.error('QRコード生成エラー:', error);
    showQRFallback(canvas);
  }

  // モーダルを表示
  modal.classList.remove('hidden');

  // Lucide iconsを再初期化
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
};

// QRコード生成失敗時のフォールバック表示
function showQRFallback(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = 200;
  canvas.height = 200;
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = '#666';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QRコードが生成できません', 100, 90);
  ctx.fillText('URLをコピーしてください', 100, 110);
}

window.closeQRModal = function() {
  const constants = window.Constants;
  document.getElementById(constants.UI_ELEMENTS.qrModal).classList.add('hidden');
};

window.copyGameId = function() {
  const gameId = window.location.pathname.split('/').pop();
  navigator.clipboard.writeText(gameId).then(function() {
    alert('ゲームIDをクリップボードにコピーしました');
  }).catch(function(err) {
    console.error('ゲームIDコピーエラー:', err);
    // フォールバック: テキストエリアを使用
    const textArea = document.createElement('textarea');
    textArea.value = gameId;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('ゲームIDをクリップボードにコピーしました');
  });
};

window.copyGameURL = function() {
  const gameUrl = window.location.href;
  navigator.clipboard.writeText(gameUrl).then(function() {
    alert('URLをクリップボードにコピーしました');
  }).catch(function(err) {
    console.error('URLコピーエラー:', err);
    // フォールバック: テキストエリアを使用
    const textArea = document.createElement('textarea');
    textArea.value = gameUrl;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('URLをクリップボードにコピーしました');
  });
};

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const constants = window.Constants;
    const modal = document.getElementById(constants.UI_ELEMENTS.qrModal);
    if (modal && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }
  }
});

// QRモーダル背景クリックで閉じる
document.addEventListener('DOMContentLoaded', function() {
  const constants = window.Constants;
  const modal = document.getElementById(constants.UI_ELEMENTS.qrModal);
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  // Lucide icons初期化
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
`;
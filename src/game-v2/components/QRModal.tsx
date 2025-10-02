import { useEffect, useRef } from 'preact/hooks';
import { JSX } from 'preact';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
}

export function QRModal({ isOpen, onClose, gameId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const handleBackgroundClick = (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // QRコード生成
  const generateQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gameUrl = window.location.href;

    try {
      // QRiousライブラリを使用
      if (window.QRious) {
        new window.QRious({
          element: canvas,
          value: gameUrl,
          size: 200,
          level: 'M'
        });
        console.log('QRコード生成成功');
      } else {
        console.error('QRiousライブラリが読み込まれていません');
        showQRFallback(canvas);
      }
    } catch (error) {
      console.error('QRコード生成エラー:', error);
      showQRFallback(canvas);
    }
  };

  // QRコード生成失敗時のフォールバック表示
  const showQRFallback = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 200;
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#374151';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QRコードが生成できません', 100, 90);
    ctx.fillText('URLをコピーしてください', 100, 110);
  };

  // ゲームIDをコピー
  const copyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      alert('ゲームIDをクリップボードにコピーしました');
    } catch (err) {
      console.error('ゲームIDコピーエラー:', err);
      alert('コピーに失敗しました');
    }
  };

  // ゲームURLをコピー
  const copyGameURL = async () => {
    try {
      const gameUrl = window.location.href;
      await navigator.clipboard.writeText(gameUrl);
      alert('URLをクリップボードにコピーしました');
    } catch (err) {
      console.error('URLコピーエラー:', err);
      alert('コピーに失敗しました');
    }
  };

  // エスケープキーのリスナーを追加とアイコン初期化
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    // Lucideアイコンの初期化
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // QRコード生成
    generateQRCode();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const gameUrl = window.location.href;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i data-lucide="share-2" className="w-5 h-5"></i>
            <span>ゲーム共有</span>
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>

        <div className="space-y-4">
          {/* QRコード表示 */}
          <div className="text-center">
            <canvas
              ref={canvasRef}
              className="mx-auto border border-gray-200 rounded"
            ></canvas>
          </div>

          {/* ゲームID */}
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">ゲームID:</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg text-gray-800 bg-gray-50 p-2 rounded flex-1">
                {gameId}
              </p>
              <button
                onClick={copyGameId}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded transition-colors"
                title="ゲームIDをコピー"
              >
                <i data-lucide="copy" className="w-4 h-4"></i>
              </button>
            </div>
          </div>

          {/* URL */}
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">URL:</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-gray-800 bg-gray-50 p-2 rounded break-all flex-1">
                {gameUrl}
              </p>
              <button
                onClick={copyGameURL}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded transition-colors"
                title="URLをコピー"
              >
                <i data-lucide="copy" className="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
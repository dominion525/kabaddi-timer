import { useEffect } from 'preact/hooks';
import { JSX } from 'preact';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsModal({ isOpen, onClose }: Props) {
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

  // エスケープキーのリスナーを追加とLucideアイコンの初期化
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    // Lucideアイコンの初期化
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i data-lucide="hammer" className="w-5 h-5"></i>
            <span style={{ fontFamily: "'DotGothic16', monospace" }}>About</span>
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>

        <div className="space-y-4 text-gray-700" style={{ fontFamily: "'DotGothic16', monospace" }}>
          {/* アプリケーション情報 */}
          <div>
            <div className="bg-gray-50 rounded-lg p-4 ml-4">
              <div className="flex items-center space-x-4">
                {/* 左側：アプリアイコン */}
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex-shrink-0 flex items-center justify-center">
                  <img src="/images/kabaddi-timer-app-icon.png" alt="Kabaddi Timer Icon" className="w-full h-full object-cover" />
                </div>

                {/* 右側：タイトル・説明文 */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-xl text-gray-800 mb-2">Kabaddi Timer</h5>
                  <p className="text-sm text-gray-600">カバディ用リアルタイムタイマー・スコアボード</p>
                </div>
              </div>
            </div>
          </div>

          {/* Development by & 開発者カード */}
          <div>
            <h4 className="font-medium mb-2 text-gray-800">Development by</h4>
            <div className="bg-gray-50 rounded-lg p-4 ml-4">
              <div className="flex items-center space-x-3">
                {/* 左側：PNG画像（角丸四角） */}
                <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex-shrink-0">
                  <img src="/images/depra6.png" alt="Developer Avatar" className="w-full h-full object-cover" />
                </div>

                {/* 右側：名前・リンク */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-gray-800 text-lg">Dominion525</h5>
                    <a href="https://twitter.com/dominion525" target="_blank" rel="noopener noreferrer"
                       className="text-gray-500 hover:text-blue-500 transition-colors" title="Twitter">
                      <i data-lucide="twitter" className="w-4 h-4"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Built with */}
          <div>
            <h4 className="font-medium mb-2 text-gray-800">Built with Cloudflare Workers</h4>
            <p className="text-sm text-gray-600 ml-4">TypeScript, Tailwind CSS, WebSocket</p>
          </div>

          {/* Special Thanks */}
          <div>
            <h4 className="font-medium mb-2 text-gray-800">Special Thanks to</h4>
            <p className="text-sm text-gray-600 mb-1 ml-4">東京レイズ and other teams</p>
          </div>

          {/* Made with love */}
          <div>
            <p className="text-sm text-gray-600">Made with ❤️ for Kabaddi Community</p>
          </div>

          {/* フッター情報 */}
          <div className="pt-4 border-t border-gray-200 text-right text-xs text-gray-500">
            <span className="flex items-center justify-end gap-1">
              <i data-lucide="github" className="w-3 h-3"></i>
              <a href="https://github.com/dominion525/kabaddi-timer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                dominion525/kabaddi-timer
              </a>
              {' (rev: '}
              <a href="https://github.com/dominion525/kabaddi-timer/commit/unknown" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                unknown
              </a>
              {')'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
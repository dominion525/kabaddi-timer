import { useEffect, useState } from 'preact/hooks';
import { JSX } from 'preact';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ControlPanel({ isOpen, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackgroundClick = (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // アニメーション制御
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 少し遅延してからスライドアップ開始
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // アニメーション完了後に非表示
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [isOpen]);

  // エスケープキーのリスナーを追加とLucideアイコンの初期化
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    // Lucideアイコンの初期化
    if (typeof (window as any).lucide !== 'undefined') {
      (window as any).lucide.createIcons();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* オーバーレイ背景 */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-100 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleBackgroundClick}
      ></div>

      {/* コントロールパネル */}
      <div
        className={`fixed inset-x-0 bottom-0 bg-white shadow-2xl z-50 transition-transform duration-200 ease-in-out ${
          isAnimating ? 'transform translate-y-0' : 'transform translate-y-full'
        }`}
        style={{ height: '50vh' }}
      >
        {/* パネル内容 */}
        <div className="relative z-50 h-full flex flex-col">
          {/* ハンドル */}
          <div className="bg-gray-200 p-2 text-center cursor-pointer" onClick={onClose}>
            <div className="w-12 h-1 bg-gray-400 rounded-full mx-auto"></div>
          </div>

          {/* コンテンツエリア */}
          <div className="flex-1 p-6 overflow-y-auto" style={{ backgroundColor: '#7F7F7F' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* チーム名設定 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">チーム名設定</h3>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value="チームA"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value="チームB"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* タイマー操作 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">タイマー操作</h3>

              {/* 時間設定 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">時間設定</label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value="60"
                    className="w-16 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="flex items-center text-sm">分</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value="0"
                    className="w-16 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="flex items-center text-sm">秒</span>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors text-sm">
                    設定
                  </button>
                </div>
                {/* プリセット */}
                <div className="flex space-x-1">
                  <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    20分
                  </button>
                  <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    15分
                  </button>
                  <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    3分
                  </button>
                </div>
              </div>

              {/* スタート/ストップ/リセット */}
              <div className="mb-4 flex space-x-2">
                <button className="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold transition-colors">
                  スタート
                </button>
                <button className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-colors">
                  ストップ
                </button>
                <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-bold transition-colors">
                  リセット
                </button>
              </div>

              {/* 時間調整ボタン */}
              <div className="space-y-2">
                <div className="flex space-x-1">
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +1分
                  </button>
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +10秒
                  </button>
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +1秒
                  </button>
                </div>
                <div className="flex space-x-1">
                  <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -1分
                  </button>
                  <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -10秒
                  </button>
                  <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -1秒
                  </button>
                </div>
              </div>
            </div>

            {/* サブタイマー操作 */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">サブタイマー操作 (30秒レイドタイマー)</h3>

              {/* スタート/ストップ/リセット */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-lg font-bold transition-colors">
                  スタート
                </button>
                <button className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-colors">
                  ストップ
                </button>
                <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-bold transition-colors">
                  リセット
                </button>
              </div>
            </div>

            {/* チーム操作グリッド */}
            <div className="bg-gradient-to-r from-red-50 via-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 relative">
              {/* 中央セパレーター */}
              <div className="absolute inset-y-4 left-1/2 w-px bg-gray-300 transform -translate-x-px"></div>

              {/* ヘッダー行 */}
              <div className="mb-4 relative z-10">
                {/* チーム名行 */}
                <div className="flex justify-between gap-x-8 mb-2">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-red-600">チームA</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-blue-600">チームB</div>
                  </div>
                </div>
                {/* カテゴリー行 */}
                <div className="flex justify-between gap-x-8">
                  <div className="flex-1 grid grid-cols-2 gap-x-2">
                    <div className="text-center">
                      <div className="text-xs text-red-600">得点</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-orange-600">Do or Die</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-x-2">
                    <div className="text-center">
                      <div className="text-xs text-orange-600">Do or Die</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-blue-600">得点</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ボタングリッド */}
              <div className="flex justify-between gap-x-8 relative z-10">
                {/* 左側表示チーム */}
                <div className="flex-1 space-y-3">
                  {/* +1ボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button className="aspect-square bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                    <button className="aspect-square bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                  </div>
                  {/* -1ボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button className="aspect-square bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                    <button className="aspect-square bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                  </div>
                  {/* リセットボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button className="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      スコア<br />リセット
                    </button>
                    <button className="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      リセット
                    </button>
                  </div>
                </div>

                {/* 右側表示チーム */}
                <div className="flex-1 space-y-3">
                  {/* +1ボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button className="aspect-square bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                    <button className="aspect-square bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                  </div>
                  {/* -1ボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button className="aspect-square bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                    <button className="aspect-square bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                  </div>
                  {/* リセットボタン行 */}
                  <div className="grid grid-cols-2 gap-x-2">
                    <button className="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      リセット
                    </button>
                    <button className="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      スコア<br />リセット
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 全体コントロール */}
            <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
              <h3 className="font-bold text-lg mb-4">全体コントロール</h3>
              <div className="flex space-x-4 justify-center">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg font-bold text-lg transition-colors">
                  コートチェンジ
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-bold text-lg transition-colors">
                  全リセット
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      </div>
    </>
  );
}
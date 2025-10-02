/** @jsxImportSource preact */
import { CreditsModal } from '../../shared/components/CreditsModal';

interface AppProps {
  revision: string;
  fullRevision: string;
}

export function App({ revision, fullRevision }: AppProps) {
  return (
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-6xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-4">
          <img src="/images/kabaddi-timer-app-icon.png" alt="カバディタイマー" class="w-12 h-12 md:w-16 md:h-16 rounded-lg" />
          カバディタイマー
        </h1>
        <p class="text-xl text-gray-600 mb-2">
          カバディ用のタイマー・スコアボードアプリケーション
        </p>
      </div>

      {/* タイマーアクセス */}
      <div class="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-8 overflow-hidden">
        <div class="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          {/* 新しいタイマー作成 */}
          <div class="bg-blue-50 p-4 md:p-6 rounded-lg w-full">
            <button onclick="createNewTimer()"
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 md:px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
              <i data-lucide="plus-circle" class="w-5 h-5"></i>
              新しいタイマーを作成
            </button>
          </div>

          {/* 既存タイマーまたは任意のID */}
          <div class="bg-green-50 p-4 md:p-6 rounded-lg w-full">
            <div class="flex gap-2 min-w-0">
              <input type="text"
                     id="timerIdInput"
                     placeholder="任意のタイマーID"
                     class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500" />
              <button onclick="goToTimer()"
                      class="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2">
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                移動
              </button>
            </div>
          </div>
        </div>

        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
            <i data-lucide="wifi" class="w-4 h-4"></i>
            複数デバイスでリアルタイム同期
          </p>
          <p class="text-sm text-gray-600 text-center flex items-center justify-center gap-2 mt-2">
            <i data-lucide="qr-code" class="w-4 h-4"></i>
            QRコードで他のデバイスに共有可能
          </p>
          <p class="text-sm text-gray-600 text-center flex items-center justify-center gap-2 mt-2">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            VSをタップすると表示が反転
          </p>
        </div>
      </div>

      {/* 機能一覧 */}
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <i data-lucide="zap" class="w-6 h-6"></i>
          主な機能
        </h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <FeatureItem icon="clock" iconColor="bg-blue-500" title="メインタイマー" description="試合時間の管理（開始・停止・リセット・時間調整）" />
            <FeatureItem icon="timer" iconColor="bg-yellow-500" title="30秒サブタイマー" description="30秒固定タイマー" />
            <FeatureItem icon="target" iconColor="bg-red-500" title="スコア管理" description="両チームの得点管理" />
          </div>

          <div class="space-y-4">
            <FeatureItem icon="alert-triangle" iconColor="bg-orange-500" title="Do or Die表示" description="各チームのDo or Dieカウント" />
            <FeatureItem icon="refresh-cw" iconColor="bg-purple-500" title="コートチェンジ" description="チーム表示位置の入れ替え" />
            <FeatureItem icon="smartphone" iconColor="bg-green-500" title="モバイル対応" description="スマートフォンでの操作" />
          </div>
        </div>
      </div>

      {/* フッター */}
      <div class="text-center mt-12 pt-8 border-t border-gray-200">
        <p class="text-gray-500 text-sm mb-2">
          Made with ❤️ for Kabaddi community
        </p>
        <p class="text-gray-500 text-sm flex items-center justify-center gap-1">
          Powered by <a href="https://dominion525.com" target="_blank" class="text-blue-600 hover:underline">Dominion525.com</a> /
          <button onclick="openCreditsModal()" class="text-gray-500 hover:text-gray-700 transition-colors">
            <i data-lucide="hammer" class="w-4 h-4"></i>
          </button>
        </p>
      </div>

      {/* クレジットモーダル */}
      <CreditsModal
        isOpen={false}
        onClose={() => {}}
        revision={revision}
        fullRevision={fullRevision}
      />
    </div>
  );
}

interface FeatureItemProps {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, iconColor, title, description }: FeatureItemProps) {
  return (
    <div class="flex items-start space-x-3">
      <div class={`w-8 h-8 ${iconColor} rounded-full flex items-center justify-center text-white`}>
        <i data-lucide={icon} class="w-4 h-4"></i>
      </div>
      <div>
        <h3 class="font-semibold text-gray-800">{title}</h3>
        <p class="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

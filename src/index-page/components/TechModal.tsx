/** @jsxImportSource preact */

interface TechModalProps {
  revision: string;
  fullRevision: string;
}

export function TechModal({ revision, fullRevision }: TechModalProps) {
  return (
    <div id="techModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-lg p-6 m-4 max-w-md w-full">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i data-lucide="hammer" class="w-5 h-5"></i>
            <span style="font-family: 'DotGothic16', monospace;">About</span>
          </h3>
          <button onclick="closeTechModal()" class="text-gray-500 hover:text-gray-700">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="space-y-6 text-gray-700" style="font-family: 'DotGothic16', monospace;">
          {/* アプリケーション情報 */}
          <div class="mb-4">
            <div class="bg-gray-50 rounded-lg p-4 ml-4">
              <div class="flex items-start space-x-4">
                {/* 左側：アプリアイコン */}
                <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex-shrink-0 flex items-center justify-center">
                  <img src="/images/kabaddi-timer-app-icon.png" alt="Kabaddi Timer Icon" class="w-full h-full object-cover" />
                </div>

                {/* 右側：タイトル・説明文 */}
                <div class="flex-1 min-w-0">
                  <h5 class="font-bold text-xl text-gray-800 mb-2">Kabaddi Timer</h5>
                  <p class="text-sm text-gray-600">カバディ用リアルタイムタイマー・スコアボード</p>
                </div>
              </div>
            </div>
          </div>

          {/* Development by & 開発者カード */}
          <div class="mb-4">
            <h4 class="font-medium mb-2 text-gray-800">Development by</h4>
            <div class="bg-gray-50 rounded-lg p-4 ml-4">
              <div class="flex items-center space-x-3">
                {/* 左側：PNG画像（角丸四角） */}
                <div class="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex-shrink-0">
                  <img src="/images/depra6.png" alt="Developer Avatar" class="w-full h-full object-cover" />
                </div>

                {/* 右側：名前・リンク */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h5 class="font-semibold text-gray-800 text-lg">Dominion525</h5>
                    <a href="https://twitter.com/dominion525" target="_blank" rel="noopener noreferrer"
                       class="text-gray-500 hover:text-blue-500 transition-colors" title="Twitter">
                      <i data-lucide="twitter" class="w-4 h-4"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Built with */}
          <div class="mb-4">
            <h4 class="font-medium mb-2 text-gray-800">Built with Cloudflare Workers</h4>
            <p class="text-sm text-gray-600 ml-4">TypeScript, Tailwind CSS, WebSocket</p>
          </div>

          {/* Special Thanks */}
          <div class="mb-4">
            <h4 class="font-medium mb-2 text-gray-800">Special Thanks to</h4>
            <p class="text-sm text-gray-600 mb-1 ml-4">東京レイズ and other teams</p>
          </div>

          {/* Made with love */}
          <div class="mb-4">
            <p class="text-sm text-gray-600">Made with ❤️ for Kabaddi Community</p>
          </div>

          {/* フッター情報 */}
          <div class="pt-4 border-t border-gray-200 text-right text-xs text-gray-500">
            <span class="flex items-center justify-end gap-1">
              <i data-lucide="github" class="w-3 h-3"></i>
              <a href="https://github.com/dominion525/kabaddi-timer" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 transition-colors">dominion525/kabaddi-timer</a>
              {' '}(rev: <a href={`https://github.com/dominion525/kabaddi-timer/commit/${fullRevision}`} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 transition-colors">{revision}</a>)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

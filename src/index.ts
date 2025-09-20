import { Hono } from 'hono';
import { GameSession } from './durable-objects/game-session';
import { Env } from './types/game';

const app = new Hono<{ Bindings: Env }>();

app.get('/ws/:gameId', async (c) => {
  const gameId = c.req.param('gameId');

  if (!gameId) {
    return c.text('Game ID is required', 400);
  }

  const id = c.env.GAME_SESSION.idFromName(gameId);
  const stub = c.env.GAME_SESSION.get(id);

  const url = new URL(c.req.url);
  url.pathname = '/websocket';

  return stub.fetch(url.toString(), {
    headers: c.req.header(),
  });
});

app.get('/game/:gameId', async (c) => {
  const gameId = c.req.param('gameId');

  if (!gameId) {
    return c.text('Game ID is required', 400);
  }

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>スコアボード - ${gameId}</title>
  <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    [x-cloak] { display: none !important; }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="app" x-data="gameApp('${gameId}')" x-cloak class="min-h-screen">
    <!-- タブレット表示用 (md以上) -->
    <div class="hidden md:flex h-screen flex-col">
      <!-- ヘッダー -->
      <div class="text-white">
        <div class="grid w-full" style="grid-template-columns: 2fr 1fr 2fr;">
          <div class="bg-red-500 p-4">
            <h1 class="text-3xl font-bold text-center" x-text="gameState.teamA.name"></h1>
          </div>
          <div class="bg-blue-600 p-4">
            <div class="text-3xl font-bold text-center">vs</div>
          </div>
          <div class="bg-blue-500 p-4">
            <h1 class="text-3xl font-bold text-center" x-text="gameState.teamB.name"></h1>
          </div>
        </div>
      </div>

      <!-- メインスコア表示 -->
      <div class="flex-1 flex">
        <!-- チームA -->
        <div class="w-1/4 bg-red-500 text-white flex flex-col justify-center items-center p-4">
          <div class="font-bold font-mono" style="font-size: 16rem; line-height: 0.8; transform: scaleY(1.5);" x-text="gameState.teamA.score"></div>
        </div>

        <!-- タイマー -->
        <div class="flex-1 bg-gray-800 text-white flex flex-col items-center justify-center">
          <div style="font-size: 12rem; line-height: 1;" class="font-bold font-mono" x-text="formatTime(timerSeconds)"></div>
          <div class="text-lg opacity-75 mt-4">
            <span x-show="timerRunning" class="text-green-400">● 動作中</span>
            <span x-show="!timerRunning" class="text-gray-400">● 停止</span>
          </div>
        </div>

        <!-- チームB -->
        <div class="w-1/4 bg-blue-500 text-white flex flex-col justify-center items-center p-4">
          <div class="font-bold font-mono" style="font-size: 16rem; line-height: 0.8; transform: scaleY(1.5);" x-text="gameState.teamB.score"></div>
        </div>
      </div>

      <!-- 接続状態とコントロールボタン -->
      <div class="bg-gray-800 text-white p-2 flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <div>
            <span x-show="connected" class="text-green-400">● 接続中</span>
            <span x-show="!connected" class="text-red-400">● 切断</span>
          </div>
          <div class="text-gray-300 text-sm">
            Game ID: <span x-text="gameId" class="font-mono"></span>
          </div>
        </div>
        <button @click="toggleControlPanel()"
                class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors">
          <span x-show="!showControlPanel">▲ コントロール</span>
          <span x-show="showControlPanel">▼ 閉じる</span>
        </button>
      </div>
    </div>

    <!-- タブレット用コントロールパネル -->
    <div x-show="showControlPanel"
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="transform translate-y-full"
         x-transition:enter-end="transform translate-y-0"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="transform translate-y-0"
         x-transition:leave-end="transform translate-y-full"
         class="hidden md:block fixed inset-x-0 bottom-0 bg-white shadow-2xl z-50"
         style="height: 60vh;">

      <!-- オーバーレイ背景 -->
      <div x-show="showControlPanel"
           @click="toggleControlPanel()"
           x-transition:enter="transition ease-out duration-300"
           x-transition:enter-start="opacity-0"
           x-transition:enter-end="opacity-50"
           x-transition:leave="transition ease-in duration-200"
           x-transition:leave-start="opacity-50"
           x-transition:leave-end="opacity-0"
           class="fixed inset-0 bg-black opacity-50 z-40"></div>

      <!-- パネル内容 -->
      <div class="relative z-50 h-full flex flex-col">
        <!-- ハンドル -->
        <div class="bg-gray-200 p-2 text-center cursor-pointer" @click="toggleControlPanel()">
          <div class="w-12 h-1 bg-gray-400 rounded-full mx-auto"></div>
        </div>

        <!-- コンテンツエリア -->
        <div class="flex-1 p-6 overflow-y-auto">
          <div class="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- チーム名設定 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-4">チーム名設定</h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">チームA</label>
                  <input type="text" x-model="teamANameInput"
                         @change="setTeamName('teamA', teamANameInput)"
                         class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">チームB</label>
                  <input type="text" x-model="teamBNameInput"
                         @change="setTeamName('teamB', teamBNameInput)"
                         class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
              </div>
            </div>

            <!-- タイマー操作 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-4">タイマー操作</h3>

              <!-- 時間設定 -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">時間設定</label>
                <div class="flex space-x-2 mb-3">
                  <input type="number" min="0" max="99" x-model.number="timerInputMinutes"
                         class="w-16 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-center">
                  <span class="flex items-center text-sm">分</span>
                  <input type="number" min="0" max="59" x-model.number="timerInputSeconds"
                         class="w-16 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-center">
                  <span class="flex items-center text-sm">秒</span>
                  <button @click="setTimer(timerInputMinutes, timerInputSeconds)"
                          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors text-sm">
                    設定
                  </button>
                </div>
                <!-- プリセット -->
                <div class="flex space-x-1">
                  <button @click="setTimer(20, 0); timerInputMinutes = 20; timerInputSeconds = 0"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    20分
                  </button>
                  <button @click="setTimer(15, 0); timerInputMinutes = 15; timerInputSeconds = 0"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    15分
                  </button>
                  <button @click="setTimer(3, 0); timerInputMinutes = 3; timerInputSeconds = 0"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    3分
                  </button>
                </div>
              </div>

              <!-- スタート/ストップ/リセット -->
              <div class="mb-4 flex space-x-2">
                <button @click="startTimer()"
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold transition-colors">
                  スタート
                </button>
                <button @click="stopTimer()"
                        class="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-colors">
                  ストップ
                </button>
                <button @click="resetTimer()"
                        class="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-bold transition-colors">
                  リセット
                </button>
              </div>

              <!-- 時間調整ボタン -->
              <div class="space-y-2">
                <div class="flex space-x-1">
                  <button @click="adjustTimer(-60)"
                          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -1分
                  </button>
                  <button @click="adjustTimer(-10)"
                          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -10秒
                  </button>
                  <button @click="adjustTimer(-1)"
                          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded text-sm transition-colors">
                    -1秒
                  </button>
                </div>
                <div class="flex space-x-1">
                  <button @click="adjustTimer(60)"
                          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +1分
                  </button>
                  <button @click="adjustTimer(10)"
                          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +10秒
                  </button>
                  <button @click="adjustTimer(1)"
                          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-sm transition-colors">
                    +1秒
                  </button>
                </div>
              </div>
            </div>

            <!-- スコア操作 -->
            <div class="space-y-4">
              <!-- チームA操作 -->
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 class="font-bold text-red-700 mb-3" x-text="gameState.teamA.name + ' 操作'"></h3>
                <div class="flex space-x-3">
                  <button @click="updateScore('teamA', 1)"
                          class="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-colors active:scale-95">
                    +1
                  </button>
                  <button @click="updateScore('teamA', -1)"
                          class="flex-1 bg-red-300 hover:bg-red-400 text-red-800 p-3 rounded-lg font-bold transition-colors active:scale-95">
                    -1
                  </button>
                </div>
              </div>

              <!-- チームB操作 -->
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 class="font-bold text-blue-700 mb-3" x-text="gameState.teamB.name + ' 操作'"></h3>
                <div class="flex space-x-3">
                  <button @click="updateScore('teamB', 1)"
                          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-bold transition-colors active:scale-95">
                    +1
                  </button>
                  <button @click="updateScore('teamB', -1)"
                          class="flex-1 bg-blue-300 hover:bg-blue-400 text-blue-800 p-3 rounded-lg font-bold transition-colors active:scale-95">
                    -1
                  </button>
                </div>
              </div>

              <!-- リセットボタン -->
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <button @click="resetScores()"
                        class="w-full bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg font-bold transition-colors active:scale-95">
                  スコアリセット
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- スマホ表示用 (md未満) -->
    <div class="md:hidden min-h-screen flex flex-col relative">
      <!-- ヘッダー -->
      <div class="text-white">
        <div class="grid w-full" style="grid-template-columns: 2fr 1fr 2fr;">
          <div class="bg-red-500 p-4">
            <h1 class="text-xl font-bold text-center" x-text="gameState.teamA.name"></h1>
          </div>
          <div class="bg-blue-600 p-4">
            <div class="text-xl font-bold text-center">vs</div>
          </div>
          <div class="bg-blue-500 p-4">
            <h1 class="text-xl font-bold text-center" x-text="gameState.teamB.name"></h1>
          </div>
        </div>
      </div>

      <!-- タイマー表示 -->
      <div class="flex-1 bg-gray-800 text-white flex flex-col justify-center items-center">
        <div style="font-size: 8rem; line-height: 1;" class="font-bold font-mono" x-text="formatTime(timerSeconds)"></div>
        <div class="text-lg mt-4">
          <span x-show="timerRunning" class="text-green-400">● 動作中</span>
          <span x-show="!timerRunning" class="text-gray-400">● 停止</span>
        </div>
      </div>

      <!-- コンパクトスコア表示 -->
      <div class="bg-white p-4">
        <div class="flex justify-between items-center">
          <div class="text-center">
            <div class="font-bold text-lg mb-1" x-text="gameState.teamA.name"></div>
            <div class="text-4xl font-bold text-red-500" x-text="gameState.teamA.score"></div>
          </div>
          <div class="text-2xl font-bold text-gray-600">VS</div>
          <div class="text-center">
            <div class="font-bold text-lg mb-1" x-text="gameState.teamB.name"></div>
            <div class="text-4xl font-bold text-blue-500" x-text="gameState.teamB.score"></div>
          </div>
        </div>
      </div>

      <!-- 接続状態とコントロールボタン -->
      <div class="bg-gray-800 text-white p-3 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <div>
            <span x-show="connected" class="text-green-400">● 接続中</span>
            <span x-show="!connected" class="text-red-400">● 切断</span>
          </div>
          <div class="text-gray-300 text-xs">
            ID: <span x-text="gameId" class="font-mono"></span>
          </div>
        </div>
        <button @click="toggleControlPanel()"
                class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors flex items-center space-x-2">
          <span x-show="!showControlPanel">▲ コントロール</span>
          <span x-show="showControlPanel">▼ 閉じる</span>
        </button>
      </div>

      <!-- スマホ用コントロールパネル -->
      <div x-show="showControlPanel"
           x-transition:enter="transition ease-out duration-300"
           x-transition:enter-start="transform translate-y-full"
           x-transition:enter-end="transform translate-y-0"
           x-transition:leave="transition ease-in duration-200"
           x-transition:leave-start="transform translate-y-0"
           x-transition:leave-end="transform translate-y-full"
           class="md:hidden fixed inset-x-0 bottom-0 bg-white shadow-2xl z-50"
           style="height: 65vh;">

        <!-- オーバーレイ背景 -->
        <div x-show="showControlPanel"
             @click="toggleControlPanel()"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-50"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-50"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 bg-black opacity-50 z-40"></div>

        <!-- パネル内容 -->
        <div class="relative z-50 h-full flex flex-col">
          <!-- ハンドル -->
          <div class="bg-gray-200 p-3 text-center cursor-pointer" @click="toggleControlPanel()">
            <div class="w-12 h-1 bg-gray-400 rounded-full mx-auto"></div>
          </div>

          <!-- コンテンツエリア -->
          <div class="flex-1 p-4 overflow-y-auto space-y-4">
            <!-- タイマー操作 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-4">タイマー操作</h3>

              <!-- 時間設定 -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">時間設定</label>
                <div class="flex space-x-2 mb-3">
                  <input type="number" min="0" max="99" x-model.number="timerInputMinutes"
                         class="w-18 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center">
                  <span class="flex items-center">分</span>
                  <input type="number" min="0" max="59" x-model.number="timerInputSeconds"
                         class="w-18 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center">
                  <span class="flex items-center">秒</span>
                  <button @click="setTimer(timerInputMinutes, timerInputSeconds)"
                          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors">
                    設定
                  </button>
                </div>
                <!-- プリセット -->
                <div class="flex space-x-2">
                  <button @click="setTimer(20, 0); timerInputMinutes = 20; timerInputSeconds = 0"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors">
                    20分
                  </button>
                  <button @click="setTimer(15, 0); timerInputMinutes = 15; timerInputSeconds = 0"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors">
                    15分
                  </button>
                  <button @click="setTimer(3, 0); timerInputMinutes = 3; timerInputSeconds = 0"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors">
                    3分
                  </button>
                </div>
              </div>

              <!-- スタート/ストップ/リセット -->
              <div class="mb-4 flex space-x-2">
                <button @click="startTimer()"
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                  スタート
                </button>
                <button @click="stopTimer()"
                        class="flex-1 bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                  ストップ
                </button>
                <button @click="resetTimer()"
                        class="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                  リセット
                </button>
              </div>

              <!-- 時間調整ボタン -->
              <div class="space-y-3">
                <div class="flex space-x-2">
                  <button @click="adjustTimer(-60)"
                          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
                    -1分
                  </button>
                  <button @click="adjustTimer(-10)"
                          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
                    -10秒
                  </button>
                  <button @click="adjustTimer(-1)"
                          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors">
                    -1秒
                  </button>
                </div>
                <div class="flex space-x-2">
                  <button @click="adjustTimer(60)"
                          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors">
                    +1分
                  </button>
                  <button @click="adjustTimer(10)"
                          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors">
                    +10秒
                  </button>
                  <button @click="adjustTimer(1)"
                          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors">
                    +1秒
                  </button>
                </div>
              </div>
            </div>

            <!-- チーム名設定 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-4">チーム名設定</h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">チームA</label>
                  <input type="text" x-model="teamANameInput"
                         @change="setTeamName('teamA', teamANameInput)"
                         class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">チームB</label>
                  <input type="text" x-model="teamBNameInput"
                         @change="setTeamName('teamB', teamBNameInput)"
                         class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
              </div>
            </div>

            <!-- チームA操作 -->
            <div class="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 class="font-bold text-red-700 mb-3 text-lg" x-text="gameState.teamA.name + ' 操作'"></h3>
              <div class="flex space-x-3">
                <button @click="updateScore('teamA', 1)"
                        class="flex-1 bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg font-bold text-lg transition-colors active:scale-95">
                  +1
                </button>
                <button @click="updateScore('teamA', -1)"
                        class="flex-1 bg-red-300 hover:bg-red-400 text-red-800 p-4 rounded-lg font-bold text-lg transition-colors active:scale-95">
                  -1
                </button>
              </div>
            </div>

            <!-- チームB操作 -->
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 class="font-bold text-blue-700 mb-3 text-lg" x-text="gameState.teamB.name + ' 操作'"></h3>
              <div class="flex space-x-3">
                <button @click="updateScore('teamB', 1)"
                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-bold text-lg transition-colors active:scale-95">
                  +1
                </button>
                <button @click="updateScore('teamB', -1)"
                        class="flex-1 bg-blue-300 hover:bg-blue-400 text-blue-800 p-4 rounded-lg font-bold text-lg transition-colors active:scale-95">
                  -1
                </button>
              </div>
            </div>

            <!-- リセットボタン -->
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <button @click="resetScores()"
                      class="w-full bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg font-bold text-lg transition-colors active:scale-95">
                スコアリセット
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function gameApp(gameId) {
      return {
        gameState: {
          teamA: { name: 'チームA', score: 0 },
          teamB: { name: 'チームB', score: 0 },
          timer: {
            totalDuration: 180,
            startTime: null,
            isRunning: false,
            isPaused: false,
            pausedAt: null,
            remainingSeconds: 180
          },
          serverTime: 0,
          lastUpdated: 0
        },
        connected: false,
        ws: null,
        gameId: gameId,
        showControlPanel: false,
        timerSeconds: 180,
        timerRunning: false,
        serverTimeOffset: 0,
        timerIntervalId: null,
        lastSyncRequest: 0,
        timerInputMinutes: 3,
        timerInputSeconds: 0,
        teamANameInput: 'チームA',
        teamBNameInput: 'チームB',

        init() {
          this.connectWebSocket();
          // タイマー更新の初期化
          this.updateTimerDisplay();
          // 定期的な時刻同期リクエスト（60秒ごと）
          setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.sendAction({
                type: 'TIME_SYNC_REQUEST',
                clientRequestTime: Date.now()
              });
            }
          }, 60000);
        },

        connectWebSocket() {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = \`\${protocol}//\${window.location.host}/ws/\${this.gameId}\`;

          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            this.connected = true;
            console.log('WebSocket connected');
            // 接続成功時に初期時刻同期を要求
            this.sendAction({
              type: 'TIME_SYNC_REQUEST',
              clientRequestTime: Date.now()
            });
          };

          this.ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);

              if (message.type === 'game_state') {
                console.log('Received game state:', message.data);
                this.gameState = message.data;

                // ローカルのチーム名入力をサーバーの値で同期
                this.teamANameInput = this.gameState.teamA.name;
                this.teamBNameInput = this.gameState.teamB.name;

                // タイマーが停止している場合、直接値を更新
                if (this.gameState.timer && !this.gameState.timer.isRunning) {
                  this.timerSeconds = Math.floor(this.gameState.timer.remainingSeconds);
                  console.log('Timer updated to:', this.timerSeconds, 'seconds');
                }

                this.updateTimerDisplay();
              }

              else if (message.type === 'time_sync') {
                const clientTime = Date.now();
                const serverTime = message.data.serverTime;
                const rtt = message.data.clientRequestTime ?
                  (clientTime - message.data.clientRequestTime) : 0;
                this.serverTimeOffset = serverTime - clientTime + (rtt / 2);
                console.log('Time sync: offset =', this.serverTimeOffset, 'ms, RTT =', rtt, 'ms');
              }

              else if (message.type === 'error') {
                console.error('Server error:', message.data);
              }

            } catch (error) {
              console.error('WebSocket message parse error:', error);
            }
          };

          this.ws.onclose = () => {
            this.connected = false;
            console.log('WebSocket disconnected');
            this.stopTimerUpdate(); // タイマー更新を停止
            setTimeout(() => this.connectWebSocket(), 3000);
          };

          this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.connected = false;
            this.stopTimerUpdate(); // タイマー更新を停止
          };
        },

        sendAction(action) {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              this.ws.send(JSON.stringify({ action }));
              console.log('Sent action:', action);
            } catch (error) {
              console.error('Failed to send action:', error);
            }
          } else {
            console.warn('WebSocket not connected, action not sent:', action);
          }
        },

        updateScore(team, points) {
          this.sendAction({
            type: 'SCORE_UPDATE',
            team: team,
            points: points
          });
        },

        resetScores() {
          this.sendAction({
            type: 'RESET_SCORES'
          });
        },

        setTeamName(team, name) {
          this.sendAction({
            type: 'SET_TEAM_NAME',
            team: team,
            name: name
          });
        },

        toggleControlPanel() {
          this.showControlPanel = !this.showControlPanel;
        },

        formatTime(seconds) {
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return minutes.toString().padStart(2, '0') + ':' + remainingSeconds.toString().padStart(2, '0');
        },

        startTimer() {
          this.sendAction({
            type: 'TIMER_START'
          });
        },

        stopTimer() {
          this.sendAction({
            type: 'TIMER_PAUSE'
          });
        },

        adjustTimer(seconds) {
          this.sendAction({
            type: 'TIMER_ADJUST',
            seconds: seconds
          });
        },

        setTimer(minutes, seconds) {
          const duration = (minutes * 60) + seconds;
          console.log('Setting timer to:', minutes, 'minutes,', seconds, 'seconds (', duration, 'total seconds)');
          this.sendAction({
            type: 'TIMER_SET',
            duration: duration
          });
        },

        resetTimer() {
          this.sendAction({
            type: 'TIMER_RESET'
          });
        },

        updateTimerDisplay() {
          // 既存のタイマーをクリア
          if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
          }

          // timerが存在しない場合は何もしない
          if (!this.gameState || !this.gameState.timer) {
            return;
          }

          // 4fpsでタイマーを更新
          this.timerIntervalId = setInterval(() => {
            try {
              if (this.gameState && this.gameState.timer) {
                const timer = this.gameState.timer;

                if (timer.isRunning && timer.startTime) {
                  const serverNow = Date.now() - this.serverTimeOffset;
                  const elapsed = (serverNow - timer.startTime) / 1000;
                  this.timerSeconds = Math.max(0, Math.floor(timer.totalDuration - elapsed));
                  this.timerRunning = true;
                } else {
                  this.timerSeconds = Math.floor(timer.remainingSeconds);
                  this.timerRunning = timer.isRunning;
                }
              }
            } catch (error) {
              console.error('Timer update error:', error);
              this.stopTimerUpdate();
            }
          }, 250);
        },

        stopTimerUpdate() {
          if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
          }
        }
      };
    }
  </script>
</body>
</html>`;

  return c.html(html);
});

app.get('/', (c) => {
  return c.text('スコアボードアプリケーション\n\n使用方法: /game/{gameId} にアクセスしてください。');
});

export default app;
export { GameSession };
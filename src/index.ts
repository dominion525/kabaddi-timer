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
    <div class="hidden md:flex h-screen flex-col bg-gray-900">
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
      <div class="flex-1 grid grid-cols-3 gap-0" :class="showStatusBar ? 'pb-16' : 'pb-0'" style="grid-template-rows: 1fr 1.5fr;">
        <!-- 上段：チームA -->
        <div class="bg-red-500 text-white flex flex-col">
          <div class="flex-1 flex items-center justify-center py-1 px-4">
            <div class="font-bold font-mono" style="font-size: 12rem; line-height: 1;" x-text="gameState.teamA.score"></div>
          </div>
          <!-- Do or Dieインジケーター -->
          <div class="h-8 flex space-x-2 px-4 mb-2">
            <template x-for="(isActive, index) in teamADoOrDieIndicators" :key="index">
              <div class="flex-1 transition-colors duration-200 rounded"
                   :class="isActive ? 'bg-yellow-400' : 'bg-red-900'"></div>
            </template>
          </div>
        </div>

        <!-- 上段：サブタイマー -->
        <div class="bg-gray-800 text-white flex flex-col items-center justify-center py-1 px-4 cursor-pointer" @click="toggleStatusBar()">
          <div class="text-center">
            <div style="font-size: 12rem; line-height: 1;" class="font-bold font-mono text-yellow-400" x-text="formattedSubTimer"></div>
            <div class="text-xs opacity-75 mt-1">
              <span x-show="gameState?.subTimer?.isRunning" class="text-green-400">● 動作中</span>
              <span x-show="gameState?.subTimer && !gameState.subTimer.isRunning" class="text-gray-400">● 停止</span>
            </div>
          </div>
        </div>

        <!-- 上段：チームB -->
        <div class="bg-blue-500 text-white flex flex-col">
          <div class="flex-1 flex items-center justify-center py-1 px-4">
            <div class="font-bold font-mono" style="font-size: 12rem; line-height: 1;" x-text="gameState.teamB.score"></div>
          </div>
          <!-- Do or Dieインジケーター -->
          <div class="h-8 flex space-x-2 px-4 mb-2">
            <template x-for="(isActive, index) in teamBDoOrDieIndicators" :key="index">
              <div class="flex-1 transition-colors duration-200 rounded"
                   :class="isActive ? 'bg-yellow-400' : 'bg-blue-900'"></div>
            </template>
          </div>
        </div>

        <!-- 下段：メインタイマー（3列全体を使用） -->
        <div class="col-span-3 bg-gray-800 text-white flex flex-col items-center justify-center px-8">
          <div style="font-size: 20rem; line-height: 0.8;" class="font-bold font-mono" x-text="formattedTimer"></div>
          <div class="text-xl opacity-75">
            <span x-show="timerRunning" class="text-green-400">● 動作中</span>
            <span x-show="!timerRunning" class="text-gray-400">● 停止</span>
          </div>
        </div>
      </div>

      <!-- 接続状態とコントロールボタン -->
      <div x-show="showStatusBar" class="bg-gray-800 text-white p-2 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50">
        <div class="flex items-center space-x-4">
          <div>
            <span x-show="connected" class="text-green-400">● 接続中</span>
            <span x-show="!connected" class="text-red-400">● 切断</span>
          </div>
          <div class="text-gray-300 text-sm">
            Game ID: <span x-text="gameId" class="font-mono"></span>
          </div>
          <div class="text-gray-400 text-xs">
            <span x-text="isDesktop ? 'PC' : 'Mobile'"></span>
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
                  <button @click="setTimerPreset('long')"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    20分
                  </button>
                  <button @click="setTimerPreset('medium')"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors">
                    15分
                  </button>
                  <button @click="setTimerPreset('short')"
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
              </div>
            </div>

            <!-- サブタイマー操作 -->
            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 class="font-bold text-lg mb-4 text-yellow-800">サブタイマー操作 (30秒レイドタイマー)</h3>

              <!-- スタート/ストップ/リセット -->
              <div class="flex space-x-2">
                <button @click="startSubTimer()"
                        class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-lg font-bold transition-colors">
                  スタート
                </button>
                <button @click="stopSubTimer()"
                        class="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-colors">
                  ストップ
                </button>
                <button @click="resetSubTimer()"
                        class="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-bold transition-colors">
                  リセット
                </button>
              </div>
            </div>

            <!-- チーム操作グリッド -->
            <div class="bg-gradient-to-r from-red-50 via-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 relative">
              <!-- 中央セパレーター -->
              <div class="absolute inset-y-4 left-1/2 w-px bg-gray-300 transform -translate-x-px"></div>
              <!-- ヘッダー行 -->
              <div class="mb-4 relative z-10">
                <!-- チーム名行 -->
                <div class="flex justify-between gap-x-8 mb-2">
                  <div class="text-center flex-1">
                    <div class="text-lg font-bold text-red-700" x-text="gameState.teamA.name"></div>
                  </div>
                  <div class="text-center flex-1">
                    <div class="text-lg font-bold text-blue-700" x-text="gameState.teamB.name"></div>
                  </div>
                </div>
                <!-- カテゴリー行 -->
                <div class="flex justify-between gap-x-8">
                  <div class="flex-1 grid grid-cols-2 gap-x-2">
                    <div class="text-center">
                      <div class="text-xs text-red-600">得点</div>
                    </div>
                    <div class="text-center">
                      <div class="text-xs text-orange-600">Do or Die</div>
                    </div>
                  </div>
                  <div class="flex-1 grid grid-cols-2 gap-x-2">
                    <div class="text-center">
                      <div class="text-xs text-orange-600">Do or Die</div>
                    </div>
                    <div class="text-center">
                      <div class="text-xs text-blue-600">得点</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ボタングリッド -->
              <div class="flex justify-between gap-x-8 relative z-10">
                <!-- チームA側（左） -->
                <div class="flex-1 space-y-3">
                  <!-- +1ボタン行 -->
                  <div class="grid grid-cols-2 gap-x-2">
                    <button @click="updateScore('teamA', 1)"
                            class="aspect-square bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                    <button @click="updateDoOrDie('teamA', 1)"
                            class="aspect-square bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                  </div>
                  <!-- -1ボタン行 -->
                  <div class="grid grid-cols-2 gap-x-2">
                    <button @click="updateScore('teamA', -1)"
                            class="aspect-square bg-red-300 hover:bg-red-400 text-red-800 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                    <button @click="updateDoOrDie('teamA', -1)"
                            class="aspect-square bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                  </div>
                  <!-- リセットボタン行 -->
                  <div class="grid grid-cols-2 gap-x-2">
                    <button @click="resetScores()"
                            class="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      スコア<br>リセット
                    </button>
                    <button @click="updateDoOrDie('teamA', -gameState.teamA.doOrDieCount)"
                            class="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      リセット
                    </button>
                  </div>
                </div>

                <!-- チームB側（右） -->
                <div class="flex-1 space-y-3">
                  <!-- +1ボタン行 -->
                  <div class="grid grid-cols-2 gap-x-2">
                    <button @click="updateDoOrDie('teamB', 1)"
                            class="aspect-square bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                    <button @click="updateScore('teamB', 1)"
                            class="aspect-square bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors active:scale-95">
                      +1
                    </button>
                  </div>
                  <!-- -1ボタン行 -->
                  <div class="grid grid-cols-2 gap-x-2">
                    <button @click="updateDoOrDie('teamB', -1)"
                            class="aspect-square bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                    <button @click="updateScore('teamB', -1)"
                            class="aspect-square bg-blue-300 hover:bg-blue-400 text-blue-800 rounded-lg font-bold transition-colors active:scale-95">
                      -1
                    </button>
                  </div>
                  <!-- リセットボタン行 -->
                  <div class="grid grid-cols-2 gap-x-2">
                    <button @click="updateDoOrDie('teamB', -gameState.teamB.doOrDieCount)"
                            class="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      リセット
                    </button>
                    <button @click="resetScores()"
                            class="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      スコア<br>リセット
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 全体コントロール -->
            <div class="bg-gray-50 p-4 rounded-lg lg:col-span-2">
              <h3 class="font-bold text-lg mb-4">全体コントロール</h3>
              <div class="flex space-x-4 justify-center">
                <button @click="courtChange()"
                        class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors">
                  コートチェンジ
                </button>
                <button @click="resetAll()"
                        class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors">
                  全リセット
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- スマホ表示用 (md未満) -->
    <div class="md:hidden min-h-screen flex flex-col bg-gray-900">
      <!-- ヘッダー -->
      <div class="text-white">
        <div class="grid w-full" style="grid-template-columns: 2fr 1fr 2fr;">
          <div class="bg-red-500 p-3">
            <h1 class="text-lg font-bold text-center" x-text="gameState.teamA.name"></h1>
          </div>
          <div class="bg-blue-600 p-3">
            <div class="text-lg font-bold text-center">vs</div>
          </div>
          <div class="bg-blue-500 p-3">
            <h1 class="text-lg font-bold text-center" x-text="gameState.teamB.name"></h1>
          </div>
        </div>
      </div>

      <!-- メインスコア表示 -->
      <div class="flex-1 grid grid-cols-3 gap-0" :class="showStatusBar ? 'pb-16' : 'pb-0'" style="grid-template-rows: 0.6fr 1fr; max-height: 50vh;">
        <!-- 上段：チームA -->
        <div class="bg-red-500 text-white flex flex-col">
          <div class="flex-1 flex items-center justify-center py-1 px-1">
            <div class="font-bold font-mono" style="font-size: 4rem; line-height: 1;" x-text="gameState.teamA.score"></div>
          </div>
          <!-- Do or Dieインジケーター -->
          <div class="h-3 flex space-x-1 px-2 pb-1">
            <template x-for="(isActive, index) in teamADoOrDieIndicators" :key="index">
              <div class="flex-1 transition-colors duration-200 rounded-sm"
                   :class="isActive ? 'bg-yellow-400' : 'bg-red-900'"></div>
            </template>
          </div>
        </div>

        <!-- 上段：サブタイマー -->
        <div class="bg-gray-800 text-white flex flex-col items-center justify-center py-1 px-1 cursor-pointer" @click="toggleStatusBar()">
          <div class="text-center">
            <div style="font-size: 4rem; line-height: 1;" class="font-bold font-mono text-yellow-400" x-text="formattedSubTimer"></div>
            <div class="text-xs opacity-75">
              <span x-show="gameState?.subTimer?.isRunning" class="text-green-400">● 動作中</span>
              <span x-show="gameState?.subTimer && !gameState.subTimer.isRunning" class="text-gray-400">● 停止</span>
            </div>
          </div>
        </div>

        <!-- 上段：チームB -->
        <div class="bg-blue-500 text-white flex flex-col">
          <div class="flex-1 flex items-center justify-center py-1 px-1">
            <div class="font-bold font-mono" style="font-size: 4rem; line-height: 1;" x-text="gameState.teamB.score"></div>
          </div>
          <!-- Do or Dieインジケーター -->
          <div class="h-3 flex space-x-1 px-2 pb-1">
            <template x-for="(isActive, index) in teamBDoOrDieIndicators" :key="index">
              <div class="flex-1 transition-colors duration-200 rounded-sm"
                   :class="isActive ? 'bg-yellow-400' : 'bg-blue-900'"></div>
            </template>
          </div>
        </div>

        <!-- 下段：メインタイマー（3列全体を使用） -->
        <div class="col-span-3 bg-gray-800 text-white flex flex-col items-center justify-center px-2">
          <div style="font-size: 8rem; line-height: 0.8;" class="font-bold font-mono" x-text="formattedTimer"></div>
          <div class="text-sm opacity-75">
            <span x-show="timerRunning" class="text-green-400">● 動作中</span>
            <span x-show="!timerRunning" class="text-gray-400">● 停止</span>
          </div>
        </div>
      </div>

      <!-- 接続状態とコントロールボタン -->
      <div x-show="showStatusBar" class="bg-gray-800 text-white p-3 flex justify-between items-center fixed bottom-0 left-0 right-0 z-50">
        <div class="flex items-center space-x-3">
          <div>
            <span x-show="connected" class="text-green-400">● 接続中</span>
            <span x-show="!connected" class="text-red-400">● 切断</span>
          </div>
          <div class="text-gray-300 text-xs">
            ID: <span x-text="gameId" class="font-mono"></span>
          </div>
          <div class="text-gray-400 text-xs">
            <span x-text="isDesktop ? 'PC' : 'Mobile'"></span>
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
           style="height: 55vh;">


        <!-- パネル内容 -->
        <div class="relative z-50 h-full flex flex-col">
          <!-- ハンドル -->
          <div class="bg-gray-200 p-3 text-center cursor-pointer" @click="toggleControlPanel()">
            <div class="w-12 h-1 bg-gray-400 rounded-full mx-auto"></div>
          </div>

          <!-- コンテンツエリア -->
          <div class="flex-1 p-3 overflow-y-auto space-y-3">

            <!-- チーム名設定 -->
            <div class="bg-gray-50 p-3 rounded-lg">
              <h3 class="font-bold text-base mb-3">チーム名設定</h3>
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
            <div class="bg-gray-50 p-3 rounded-lg">
              <h3 class="font-bold text-base mb-3">タイマー操作</h3>

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
                  <button @click="setTimerPreset('long')"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors">
                    20分
                  </button>
                  <button @click="setTimerPreset('medium')"
                          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors">
                    15分
                  </button>
                  <button @click="setTimerPreset('short')"
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
              </div>
            </div>

            <!-- サブタイマー操作 -->
            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 class="font-bold text-lg mb-4 text-yellow-800">サブタイマー操作 (30秒レイドタイマー)</h3>

              <!-- スタート/ストップ/リセット -->
              <div class="flex space-x-2">
                <button @click="startSubTimer()"
                        class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                  スタート
                </button>
                <button @click="stopSubTimer()"
                        class="flex-1 bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                  ストップ
                </button>
                <button @click="resetSubTimer()"
                        class="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg font-bold text-lg transition-colors">
                  リセット
                </button>
              </div>
            </div>

            <!-- チーム操作グリッド -->
            <div class="bg-gradient-to-r from-red-50 via-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 relative">
              <!-- 中央セパレーター -->
              <div class="absolute inset-y-4 left-1/2 w-px bg-gray-300 transform -translate-x-px"></div>

              <!-- ヘッダー行 -->
              <div class="mb-4 relative z-10">
                <!-- チーム名行 -->
                <div class="flex justify-between gap-x-6 mb-2">
                  <div class="text-center flex-1">
                    <div class="text-base font-bold text-red-700" x-text="gameState.teamA.name"></div>
                  </div>
                  <div class="text-center flex-1">
                    <div class="text-base font-bold text-blue-700" x-text="gameState.teamB.name"></div>
                  </div>
                </div>
                <!-- カテゴリー行 -->
                <div class="flex justify-between gap-x-6">
                  <div class="flex-1 grid grid-cols-2 gap-x-1">
                    <div class="text-center">
                      <div class="text-xs text-red-600">得点</div>
                    </div>
                    <div class="text-center">
                      <div class="text-xs text-orange-600">Do or Die</div>
                    </div>
                  </div>
                  <div class="flex-1 grid grid-cols-2 gap-x-1">
                    <div class="text-center">
                      <div class="text-xs text-orange-600">Do or Die</div>
                    </div>
                    <div class="text-center">
                      <div class="text-xs text-blue-600">得点</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ボタングリッド -->
              <div class="flex justify-between gap-x-6 relative z-10">
                <!-- チームA側（左） -->
                <div class="flex-1 space-y-2">
                  <!-- +1ボタン行 -->
                  <div class="grid grid-cols-2 gap-x-1">
                    <button @click="updateScore('teamA', 1)"
                            class="h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-base transition-colors active:scale-95">
                      +1
                    </button>
                    <button @click="updateDoOrDie('teamA', 1)"
                            class="h-12 bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold text-base transition-colors active:scale-95">
                      +1
                    </button>
                  </div>
                  <!-- -1ボタン行 -->
                  <div class="grid grid-cols-2 gap-x-1">
                    <button @click="updateScore('teamA', -1)"
                            class="h-12 bg-red-300 hover:bg-red-400 text-red-800 rounded-lg font-bold text-base transition-colors active:scale-95">
                      -1
                    </button>
                    <button @click="updateDoOrDie('teamA', -1)"
                            class="h-12 bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold text-base transition-colors active:scale-95">
                      -1
                    </button>
                  </div>
                  <!-- リセットボタン行 -->
                  <div class="grid grid-cols-2 gap-x-1">
                    <button @click="resetScores()"
                            class="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      スコア<br>リセット
                    </button>
                    <button @click="updateDoOrDie('teamA', -gameState.teamA.doOrDieCount)"
                            class="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      リセット
                    </button>
                  </div>
                </div>

                <!-- チームB側（右） -->
                <div class="flex-1 space-y-2">
                  <!-- +1ボタン行 -->
                  <div class="grid grid-cols-2 gap-x-1">
                    <button @click="updateDoOrDie('teamB', 1)"
                            class="h-12 bg-orange-400 hover:bg-orange-500 text-white rounded-lg font-bold text-base transition-colors active:scale-95">
                      +1
                    </button>
                    <button @click="updateScore('teamB', 1)"
                            class="h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-base transition-colors active:scale-95">
                      +1
                    </button>
                  </div>
                  <!-- -1ボタン行 -->
                  <div class="grid grid-cols-2 gap-x-1">
                    <button @click="updateDoOrDie('teamB', -1)"
                            class="h-12 bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg font-bold text-base transition-colors active:scale-95">
                      -1
                    </button>
                    <button @click="updateScore('teamB', -1)"
                            class="h-12 bg-blue-300 hover:bg-blue-400 text-blue-800 rounded-lg font-bold text-base transition-colors active:scale-95">
                      -1
                    </button>
                  </div>
                  <!-- リセットボタン行 -->
                  <div class="grid grid-cols-2 gap-x-1">
                    <button @click="updateDoOrDie('teamB', -gameState.teamB.doOrDieCount)"
                            class="h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      リセット
                    </button>
                    <button @click="resetScores()"
                            class="h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs transition-colors active:scale-95">
                      スコア<br>リセット
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 全体コントロール -->
            <div class="bg-gray-50 p-3 rounded-lg">
              <h3 class="font-bold text-base mb-3">全体コントロール</h3>
              <div class="grid grid-cols-2 gap-3">
                <button @click="courtChange()"
                        class="bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold text-base transition-colors">
                  コートチェンジ
                </button>
                <button @click="resetAll()"
                        class="bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-base transition-colors">
                  全リセット
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function gameApp(gameId) {
      // デフォルト値の一元管理（Single Source of Truth）
      const DEFAULT_VALUES = {
        teamNames: {
          teamA: 'チームA',
          teamB: 'チームB'
        },
        timer: {
          defaultDuration: 180, // 3分
          presetMinutes: {
            short: 3,
            medium: 15,
            long: 20
          }
        },
        score: 0,
        doOrDieCount: 0
      };

      // アクションタイプの一元管理
      const ACTIONS = {
        TIMER_START: { type: 'TIMER_START' },
        TIMER_PAUSE: { type: 'TIMER_PAUSE' },
        TIMER_RESET: { type: 'TIMER_RESET' },
        RESET_SCORES: { type: 'RESET_SCORES' },
        DO_OR_DIE_RESET: { type: 'DO_OR_DIE_RESET' }
      };

      return {
        gameState: {
          teamA: { name: DEFAULT_VALUES.teamNames.teamA, score: DEFAULT_VALUES.score, doOrDieCount: DEFAULT_VALUES.doOrDieCount },
          teamB: { name: DEFAULT_VALUES.teamNames.teamB, score: DEFAULT_VALUES.score, doOrDieCount: DEFAULT_VALUES.doOrDieCount },
          timer: {
            totalDuration: DEFAULT_VALUES.timer.defaultDuration,
            startTime: null,
            isRunning: false,
            isPaused: false,
            pausedAt: null,
            remainingSeconds: DEFAULT_VALUES.timer.defaultDuration
          },
          serverTime: 0,
          lastUpdated: 0
        },
        connected: false,
        ws: null,
        gameId: gameId,
        showControlPanel: false,
        showStatusBar: true,
        timerSeconds: DEFAULT_VALUES.timer.defaultDuration,
        timerRunning: false,
        subTimerSeconds: 30,
        subTimerRunning: false,
        serverTimeOffset: 0,
        timerAnimationId: null,
        timeSyncIntervalId: null,
        reconnectTimeoutId: null,
        lastSyncRequest: 0,
        timerInputMinutes: DEFAULT_VALUES.timer.presetMinutes.short,
        timerInputSeconds: 0,
        teamANameInput: DEFAULT_VALUES.teamNames.teamA,
        teamBNameInput: DEFAULT_VALUES.teamNames.teamB,
        isDesktop: window.matchMedia('(min-width: 768px)').matches,

        init() {
          // 既存のアニメーション・インターバルをクリアして重複を防止
          if (this.timerAnimationId) {
            cancelAnimationFrame(this.timerAnimationId);
            this.timerAnimationId = null;
          }
          if (this.timeSyncIntervalId) {
            clearInterval(this.timeSyncIntervalId);
            this.timeSyncIntervalId = null;
          }

          this.connectWebSocket();
          // タイマー更新の初期化
          this.updateTimerDisplay();

          // 画面サイズ変更監視
          const mediaQuery = window.matchMedia('(min-width: 768px)');
          const handleMediaChange = (e) => {
            this.isDesktop = e.matches;
          };
          mediaQuery.addListener(handleMediaChange);

          // 定期的な時刻同期リクエスト（60秒ごと）
          this.timeSyncIntervalId = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.sendAction({
                type: 'TIME_SYNC_REQUEST',
                clientRequestTime: Date.now()
              });
            }
          }, 60000);
        },

        connectWebSocket() {
          // 既存のWebSocket接続をクリーンアップ
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }

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

                  // タイマー入力値も同期
                  this.timerInputMinutes = Math.floor(this.gameState.timer.remainingSeconds / 60);
                  this.timerInputSeconds = this.gameState.timer.remainingSeconds % 60;

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

            // 既存の再接続タイマーをクリア
            if (this.reconnectTimeoutId) {
              clearTimeout(this.reconnectTimeoutId);
              this.reconnectTimeoutId = null;
            }

            // 3秒後に再接続
            this.reconnectTimeoutId = setTimeout(() => this.connectWebSocket(), 3000);
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
          this.sendAction(ACTIONS.RESET_SCORES);
        },

        courtChange() {
          this.sendAction({ type: 'COURT_CHANGE' });
        },

        resetAll() {
          this.sendAction({ type: 'RESET_ALL' });
        },

        updateDoOrDie(team, delta) {
          this.sendAction({
            type: 'DO_OR_DIE_UPDATE',
            team: team,
            delta: delta
          });
        },

        resetDoOrDie() {
          this.sendAction(ACTIONS.DO_OR_DIE_RESET);
        },

        get teamADoOrDieIndicators() {
          return Array(3).fill(0).map((_, i) => i < (this.gameState.teamA.doOrDieCount || 0));
        },

        get teamBDoOrDieIndicators() {
          return Array(3).fill(0).map((_, i) => i < (this.gameState.teamB.doOrDieCount || 0));
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

        toggleStatusBar() {
          this.showStatusBar = !this.showStatusBar;
        },

        get formattedTimer() {
          const minutes = Math.floor(this.timerSeconds / 60);
          const remainingSeconds = this.timerSeconds % 60;
          return minutes.toString().padStart(2, '0') + ':' + remainingSeconds.toString().padStart(2, '0');
        },

        get formattedSubTimer() {
          return this.subTimerSeconds.toString().padStart(2, '0');
        },

        startTimer() {
          this.sendAction(ACTIONS.TIMER_START);
        },

        stopTimer() {
          this.sendAction(ACTIONS.TIMER_PAUSE);
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

        setTimerPreset(presetKey) {
          const minutes = DEFAULT_VALUES.timer.presetMinutes[presetKey];
          this.timerInputMinutes = minutes;
          this.timerInputSeconds = 0;
          this.setTimer(minutes, 0);
        },

        resetTimer() {
          this.sendAction(ACTIONS.TIMER_RESET);
        },

        startSubTimer() {
          this.sendAction({ type: 'SUB_TIMER_START' });
        },

        stopSubTimer() {
          this.sendAction({ type: 'SUB_TIMER_PAUSE' });
        },

        resetSubTimer() {
          this.sendAction({ type: 'SUB_TIMER_RESET' });
        },

        updateTimerDisplay() {
          this.stopTimerUpdate(); // 既存のタイマーをクリア

          if (!this.gameState?.timer) {
            return;
          }

          this.startTimerUpdate();
        },

        startTimerUpdate() {
          if (this.timerAnimationId) return; // 重複防止

          const updateLoop = () => {
            try {
              this.calculateTimerSeconds();
              this.calculateSubTimerSeconds();
              this.timerAnimationId = requestAnimationFrame(updateLoop);
            } catch (error) {
              console.error('Timer update error:', error);
              this.stopTimerUpdate();
            }
          };
          this.timerAnimationId = requestAnimationFrame(updateLoop);
        },

        calculateTimerSeconds() {
          const timer = this.gameState?.timer;
          if (!timer) return;

          if (timer.isRunning && timer.startTime) {
            const serverNow = Date.now() - this.serverTimeOffset;
            const elapsed = (serverNow - timer.startTime) / 1000;
            this.timerSeconds = Math.max(0, Math.floor(timer.totalDuration - elapsed));
            // タイマーが0になったら停止状態として表示
            this.timerRunning = this.timerSeconds > 0;
          } else {
            this.timerSeconds = Math.floor(timer.remainingSeconds);
            this.timerRunning = timer.isRunning;
          }
        },

        calculateSubTimerSeconds() {
          const subTimer = this.gameState?.subTimer;
          if (!subTimer) return;

          if (subTimer.isRunning && subTimer.startTime) {
            const serverNow = Date.now() - this.serverTimeOffset;
            const elapsed = (serverNow - subTimer.startTime) / 1000;
            this.subTimerSeconds = Math.max(0, Math.floor(subTimer.totalDuration - elapsed));
            // サブタイマーが0になったら停止状態として表示
            this.subTimerRunning = this.subTimerSeconds > 0;
          } else {
            this.subTimerSeconds = Math.floor(subTimer.remainingSeconds);
            this.subTimerRunning = subTimer.isRunning;
          }
        },

        stopTimerUpdate() {
          if (this.timerAnimationId) {
            cancelAnimationFrame(this.timerAnimationId);
            this.timerAnimationId = null;
          }
        },

        cleanup() {
          // 全てのアニメーション・インターバルをクリア
          if (this.timerAnimationId) {
            cancelAnimationFrame(this.timerAnimationId);
            this.timerAnimationId = null;
          }
          if (this.timeSyncIntervalId) {
            clearInterval(this.timeSyncIntervalId);
            this.timeSyncIntervalId = null;
          }

          // 再接続タイマーをクリア
          if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
          }

          // WebSocket接続をクローズ
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }

          this.connected = false;
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
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
      <div class="bg-blue-600 text-white p-4 text-center">
        <h1 class="text-3xl font-bold">スコアボード</h1>
        <p class="text-lg opacity-90">ゲーム: ${gameId}</p>
      </div>

      <!-- メインスコア表示 -->
      <div class="flex-1 flex">
        <!-- チームA -->
        <div class="flex-1 bg-red-500 text-white flex flex-col justify-center items-center p-8">
          <h2 class="text-4xl font-bold mb-4" x-text="gameState.teamA.name"></h2>
          <div class="text-9xl font-bold" x-text="gameState.teamA.score"></div>
        </div>

        <!-- 対 -->
        <div class="w-20 bg-gray-800 text-white flex items-center justify-center">
          <span class="text-4xl font-bold">VS</span>
        </div>

        <!-- チームB -->
        <div class="flex-1 bg-blue-500 text-white flex flex-col justify-center items-center p-8">
          <h2 class="text-4xl font-bold mb-4" x-text="gameState.teamB.name"></h2>
          <div class="text-9xl font-bold" x-text="gameState.teamB.score"></div>
        </div>
      </div>

      <!-- 接続状態 -->
      <div class="bg-gray-800 text-white p-2 text-center">
        <span x-show="connected" class="text-green-400">● 接続中</span>
        <span x-show="!connected" class="text-red-400">● 切断</span>
      </div>
    </div>

    <!-- スマホ表示用 (md未満) -->
    <div class="md:hidden min-h-screen flex flex-col">
      <!-- ヘッダー -->
      <div class="bg-blue-600 text-white p-4 text-center">
        <h1 class="text-xl font-bold">スコアボード</h1>
        <p class="opacity-90">ゲーム: ${gameId}</p>
      </div>

      <!-- コンパクトスコア表示 -->
      <div class="bg-white p-4">
        <div class="flex justify-between items-center">
          <div class="text-center">
            <div class="font-bold text-lg" x-text="gameState.teamA.name"></div>
            <div class="text-4xl font-bold text-red-500" x-text="gameState.teamA.score"></div>
          </div>
          <div class="text-2xl font-bold text-gray-600">VS</div>
          <div class="text-center">
            <div class="font-bold text-lg" x-text="gameState.teamB.name"></div>
            <div class="text-4xl font-bold text-blue-500" x-text="gameState.teamB.score"></div>
          </div>
        </div>
      </div>

      <!-- チーム名編集 -->
      <div class="bg-gray-50 p-4">
        <h3 class="font-bold mb-2">チーム名設定</h3>
        <div class="space-y-2">
          <input type="text" :value="gameState.teamA.name"
                 @change="setTeamName('teamA', $event.target.value)"
                 class="w-full p-2 border rounded" placeholder="チームA名">
          <input type="text" :value="gameState.teamB.name"
                 @change="setTeamName('teamB', $event.target.value)"
                 class="w-full p-2 border rounded" placeholder="チームB名">
        </div>
      </div>

      <!-- 操作パネル -->
      <div class="flex-1 p-4 space-y-4">
        <!-- チームA操作 -->
        <div class="bg-red-100 p-4 rounded-lg">
          <h3 class="font-bold text-red-700 mb-3" x-text="gameState.teamA.name + ' 操作'"></h3>
          <div class="flex space-x-2">
            <button @click="updateScore('teamA', 1)"
                    class="flex-1 bg-red-500 text-white p-3 rounded font-bold active:bg-red-600">
              +1
            </button>
            <button @click="updateScore('teamA', -1)"
                    class="flex-1 bg-red-300 text-red-800 p-3 rounded font-bold active:bg-red-400">
              -1
            </button>
          </div>
        </div>

        <!-- チームB操作 -->
        <div class="bg-blue-100 p-4 rounded-lg">
          <h3 class="font-bold text-blue-700 mb-3" x-text="gameState.teamB.name + ' 操作'"></h3>
          <div class="flex space-x-2">
            <button @click="updateScore('teamB', 1)"
                    class="flex-1 bg-blue-500 text-white p-3 rounded font-bold active:bg-blue-600">
              +1
            </button>
            <button @click="updateScore('teamB', -1)"
                    class="flex-1 bg-blue-300 text-blue-800 p-3 rounded font-bold active:bg-blue-400">
              -1
            </button>
          </div>
        </div>

        <!-- リセットボタン -->
        <div class="bg-gray-100 p-4 rounded-lg">
          <button @click="resetScores()"
                  class="w-full bg-gray-600 text-white p-3 rounded font-bold active:bg-gray-700">
            スコアリセット
          </button>
        </div>
      </div>

      <!-- 接続状態 -->
      <div class="bg-gray-800 text-white p-2 text-center">
        <span x-show="connected" class="text-green-400">● 接続中</span>
        <span x-show="!connected" class="text-red-400">● 切断</span>
      </div>
    </div>
  </div>

  <script>
    function gameApp(gameId) {
      return {
        gameState: {
          teamA: { name: 'チームA', score: 0 },
          teamB: { name: 'チームB', score: 0 },
          lastUpdated: 0
        },
        connected: false,
        ws: null,
        gameId: gameId,

        init() {
          this.connectWebSocket();
        },

        connectWebSocket() {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = \`\${protocol}//\${window.location.host}/ws/\${this.gameId}\`;

          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            this.connected = true;
            console.log('WebSocket connected');
          };

          this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'game_state') {
              this.gameState = message.data;
            }
          };

          this.ws.onclose = () => {
            this.connected = false;
            console.log('WebSocket disconnected');
            setTimeout(() => this.connectWebSocket(), 3000);
          };

          this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.connected = false;
          };
        },

        sendAction(action) {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action }));
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
import { GameState, GameAction, GameMessage, WebSocketMessage, TimeSyncData } from '../types/game';

export class GameSession {
  private state: DurableObjectState;
  private connections: Set<WebSocket> = new Set();
  private gameState: GameState;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.gameState = {
      teamA: { name: 'チームA', score: 0 },
      teamB: { name: 'チームB', score: 0 },
      timer: {
        totalDuration: 3 * 60, // デフォルト3分
        startTime: null,
        isRunning: false,
        isPaused: false,
        pausedAt: null,
        remainingSeconds: 3 * 60
      },
      serverTime: Date.now(),
      lastUpdated: Date.now()
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      await this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleSession(webSocket: WebSocket): Promise<void> {
    webSocket.accept();
    this.connections.add(webSocket);

    await this.loadGameState();

    // ゲーム状態を送信
    this.sendToClient(webSocket, {
      type: 'game_state',
      data: this.gameState,
      timestamp: Date.now()
    });

    // 初期時刻同期を送信
    this.sendToClient(webSocket, {
      type: 'time_sync',
      data: { serverTime: Date.now() },
      timestamp: Date.now()
    });

    // 定期的な時刻同期アラームを設定（60秒後）
    if (this.connections.size === 1) {
      // 最初の接続時のみアラームを設定
      await this.state.storage.setAlarm(Date.now() + 60000);
    }

    webSocket.addEventListener('message', async (event) => {
      try {
        console.log('Received raw message:', event.data);
        const message: WebSocketMessage = JSON.parse(event.data as string);
        console.log('Parsed message:', message);

        if (!message.action) {
          throw new Error('Missing action field');
        }

        await this.handleAction(message.action);
      } catch (error) {
        console.error('Message processing error:', error);
        console.error('Raw data:', event.data);
        this.sendToClient(webSocket, {
          type: 'error',
          data: `Invalid message format: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now()
        });
      }
    });

    webSocket.addEventListener('close', () => {
      this.connections.delete(webSocket);
    });

    webSocket.addEventListener('error', () => {
      this.connections.delete(webSocket);
    });
  }

  private async loadGameState(): Promise<void> {
    const stored = await this.state.storage.get<GameState>('gameState');
    if (stored) {
      this.gameState = stored;
      // 古いデータにtimerプロパティがない場合の対応
      if (!this.gameState.timer) {
        this.gameState.timer = {
          totalDuration: 3 * 60,
          startTime: null,
          isRunning: false,
          isPaused: false,
          pausedAt: null,
          remainingSeconds: 3 * 60
        };
      }
    }
  }

  private async saveGameState(): Promise<void> {
    this.gameState.serverTime = Date.now();
    this.gameState.lastUpdated = Date.now();
    // タイマーが実行中の場合、残り時間を更新
    if (this.gameState.timer && this.gameState.timer.isRunning) {
      this.updateRemainingTime();
    }
    await this.state.storage.put('gameState', this.gameState);
  }

  private async handleAction(action: GameAction): Promise<void> {
    switch (action.type) {
      case 'SCORE_UPDATE':
        if (action.team === 'teamA') {
          this.gameState.teamA.score = Math.max(0, this.gameState.teamA.score + action.points);
        } else {
          this.gameState.teamB.score = Math.max(0, this.gameState.teamB.score + action.points);
        }
        break;

      case 'RESET_SCORES':
        this.gameState.teamA.score = 0;
        this.gameState.teamB.score = 0;
        break;

      case 'SET_TEAM_NAME':
        if (action.team === 'teamA') {
          this.gameState.teamA.name = action.name;
        } else {
          this.gameState.teamB.name = action.name;
        }
        break;

      case 'TIMER_START':
        if (!this.gameState.timer.isRunning) {
          const now = Date.now();
          if (this.gameState.timer.isPaused) {
            // 一時停止からの再開
            const pausedDuration = now - (this.gameState.timer.pausedAt || now);
            this.gameState.timer.startTime = (this.gameState.timer.startTime || now) + pausedDuration;
            this.gameState.timer.isPaused = false;
            this.gameState.timer.pausedAt = null;
          } else {
            // 新規開始
            this.gameState.timer.startTime = now;
          }
          this.gameState.timer.isRunning = true;
        }
        await this.saveGameState();
        this.broadcastState();
        this.broadcastTimeSync();
        return;

      case 'TIMER_PAUSE':
        if (this.gameState.timer.isRunning) {
          this.gameState.timer.isRunning = false;
          this.gameState.timer.isPaused = true;
          this.gameState.timer.pausedAt = Date.now();
          // 現在の残り時間を計算して保存
          this.updateRemainingTime();
        }
        await this.saveGameState();
        this.broadcastState();
        this.broadcastTimeSync();
        return;

      case 'TIMER_RESET':
        this.gameState.timer.startTime = null;
        this.gameState.timer.isRunning = false;
        this.gameState.timer.isPaused = false;
        this.gameState.timer.pausedAt = null;
        this.gameState.timer.remainingSeconds = this.gameState.timer.totalDuration;
        await this.saveGameState();
        this.broadcastState();
        this.broadcastTimeSync();
        return;

      case 'TIMER_SET':
        this.gameState.timer.totalDuration = action.duration;
        this.gameState.timer.remainingSeconds = action.duration;
        this.gameState.timer.startTime = null;
        this.gameState.timer.isRunning = false;
        this.gameState.timer.isPaused = false;
        this.gameState.timer.pausedAt = null;
        await this.saveGameState();
        this.broadcastState();
        this.broadcastTimeSync();
        return;

      case 'TIMER_ADJUST':
        if (this.gameState.timer.isRunning) {
          // タイマー実行中の場合、startTimeを調整
          this.gameState.timer.startTime = (this.gameState.timer.startTime || Date.now()) - (action.seconds * 1000);
        } else {
          // 停止中の場合、remainingSecondsを直接調整
          this.gameState.timer.remainingSeconds = Math.max(0, this.gameState.timer.remainingSeconds + action.seconds);
        }
        await this.saveGameState();
        this.broadcastState();
        this.broadcastTimeSync();
        return;

      case 'TIME_SYNC_REQUEST':
        // 時刻同期レスポンスを送信（状態は変更しない）
        const syncData: TimeSyncData = {
          serverTime: Date.now(),
          clientRequestTime: action.clientRequestTime
        };

        const syncMessage: GameMessage = {
          type: 'time_sync',
          data: syncData,
          timestamp: Date.now()
        };

        // リクエスト元にのみ送信
        for (const connection of this.connections) {
          try {
            connection.send(JSON.stringify(syncMessage));
          } catch (error) {
            this.connections.delete(connection);
          }
        }
        return;

      default:
        return;
    }

    await this.saveGameState();
    this.broadcastState();
  }

  private broadcastState(): void {
    // サーバー時刻を更新
    this.gameState.serverTime = Date.now();

    const message: GameMessage = {
      type: 'game_state',
      data: this.gameState,
      timestamp: Date.now()
    };

    const messageString = JSON.stringify(message);

    for (const connection of this.connections) {
      try {
        connection.send(messageString);
      } catch (error) {
        this.connections.delete(connection);
      }
    }
  }

  private sendToClient(webSocket: WebSocket, message: GameMessage): void {
    try {
      webSocket.send(JSON.stringify(message));
    } catch (error) {
      this.connections.delete(webSocket);
    }
  }

  private updateRemainingTime(): void {
    if (this.gameState.timer.startTime && this.gameState.timer.isRunning) {
      const elapsed = (Date.now() - this.gameState.timer.startTime) / 1000;
      this.gameState.timer.remainingSeconds = Math.max(0, this.gameState.timer.totalDuration - elapsed);
    }
  }

  private broadcastTimeSync(): void {
    const syncData: TimeSyncData = {
      serverTime: Date.now()
    };

    const message: GameMessage = {
      type: 'time_sync',
      data: syncData,
      timestamp: Date.now()
    };

    const messageString = JSON.stringify(message);

    for (const connection of this.connections) {
      try {
        connection.send(messageString);
      } catch (error) {
        this.connections.delete(connection);
      }
    }
  }

  async alarm(): Promise<void> {
    // 接続が残っている場合のみ時刻同期を実行
    if (this.connections.size > 0) {
      this.broadcastTimeSync();
      // 次のアラームを設定（60秒後）
      await this.state.storage.setAlarm(Date.now() + 60000);
    }
  }
}
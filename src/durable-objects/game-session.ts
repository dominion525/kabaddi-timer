import { GameState, GameAction, GameMessage, WebSocketMessage, TimeSyncData } from '../types/game';

export class GameSession {
  private state: DurableObjectState;
  private connections: Set<WebSocket> = new Set();
  private gameState: GameState;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.gameState = this.getDefaultGameState();
  }

  private getDefaultGameState(): GameState {
    return {
      teamA: { name: 'チームA', score: 0, doOrDieCount: 0 },
      teamB: { name: 'チームB', score: 0, doOrDieCount: 0 },
      timer: {
        totalDuration: 3 * 60, // デフォルト3分
        startTime: null,
        isRunning: false,
        isPaused: false,
        pausedAt: null,
        remainingSeconds: 3 * 60
      },
      subTimer: {
        totalDuration: 30, // 固定30秒
        startTime: null,
        isRunning: false,
        isPaused: false,
        pausedAt: null,
        remainingSeconds: 30
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

    // ゲーム状態を送信（gameStateは常に利用可能）
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
          data: `Invalid message format: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: Date.now()
        });
      }
    });

    webSocket.addEventListener('close', () => {
      this.safelyDeleteConnection(webSocket);
    });

    webSocket.addEventListener('error', (event) => {
      console.warn('WebSocket error:', event);
      this.safelyDeleteConnection(webSocket);
    });
  }

  private isStateLoaded = false;

  private async loadGameState(): Promise<void> {
    if (this.isStateLoaded) {
      return;
    }

    try {
      const stored = await this.state.storage.get<any>('gameState');

      if (stored) {
        // データ検証を実行
        if (this.validateGameState(stored)) {
          this.gameState = stored;
          console.log('Valid game state loaded from storage');
        } else {
          // 検証失敗の場合は修復を試行
          console.warn('Invalid game state detected, attempting repair');
          this.gameState = this.repairGameState(stored);
          console.log('Game state repaired successfully');
        }
      } else {
        // 初回アクセス時はデフォルト状態を使用（既に初期化済み）
        console.log('No stored state found, using default state');
      }
    } catch (error) {
      // ストレージアクセスエラーの場合はデフォルト状態で継続（既に初期化済み）
      console.error('Failed to load game state from storage:', error);
    }

    this.isStateLoaded = true;
    // 初期化完了後に即座に保存
    await this.saveGameState();
  }

  private validateGameState(state: any): state is GameState {
    if (!state || typeof state !== 'object') return false;

    // チーム情報の検証
    if (!state.teamA || !state.teamB) return false;
    if (typeof state.teamA.name !== 'string' || typeof state.teamA.score !== 'number') return false;
    if (typeof state.teamB.name !== 'string' || typeof state.teamB.score !== 'number') return false;
    if (typeof state.teamA.doOrDieCount !== 'number' || state.teamA.doOrDieCount < 0 || state.teamA.doOrDieCount > 3) return false;
    if (typeof state.teamB.doOrDieCount !== 'number' || state.teamB.doOrDieCount < 0 || state.teamB.doOrDieCount > 3) return false;

    // タイマー情報の検証
    if (!state.timer) return false;
    const timer = state.timer;
    if (typeof timer.totalDuration !== 'number' || timer.totalDuration <= 0) return false;
    if (typeof timer.isRunning !== 'boolean') return false;
    if (typeof timer.isPaused !== 'boolean') return false;
    if (typeof timer.remainingSeconds !== 'number' || timer.remainingSeconds < 0) return false;

    // サブタイマー情報の検証（オプショナルなのでstateにない場合はスキップ）
    if (state.subTimer) {
      const subTimer = state.subTimer;
      if (typeof subTimer.totalDuration !== 'number' || subTimer.totalDuration <= 0) return false;
      if (typeof subTimer.isRunning !== 'boolean') return false;
      if (typeof subTimer.isPaused !== 'boolean') return false;
      if (typeof subTimer.remainingSeconds !== 'number' || subTimer.remainingSeconds < 0) return false;
    }

    // 基本時刻情報の検証
    if (typeof state.serverTime !== 'number' || typeof state.lastUpdated !== 'number') return false;

    return true;
  }

  private repairGameState(state: any): GameState {
    const defaultState = this.getDefaultGameState();

    const repairedState: GameState = {
      teamA: {
        name: (state?.teamA?.name && typeof state.teamA.name === 'string') ? state.teamA.name : defaultState.teamA.name,
        score: (state?.teamA?.score && typeof state.teamA.score === 'number' && state.teamA.score >= 0) ? state.teamA.score : defaultState.teamA.score,
        doOrDieCount: (state?.teamA?.doOrDieCount && typeof state.teamA.doOrDieCount === 'number' && state.teamA.doOrDieCount >= 0 && state.teamA.doOrDieCount <= 3) ? state.teamA.doOrDieCount : defaultState.teamA.doOrDieCount
      },
      teamB: {
        name: (state?.teamB?.name && typeof state.teamB.name === 'string') ? state.teamB.name : defaultState.teamB.name,
        score: (state?.teamB?.score && typeof state.teamB.score === 'number' && state.teamB.score >= 0) ? state.teamB.score : defaultState.teamB.score,
        doOrDieCount: (state?.teamB?.doOrDieCount && typeof state.teamB.doOrDieCount === 'number' && state.teamB.doOrDieCount >= 0 && state.teamB.doOrDieCount <= 3) ? state.teamB.doOrDieCount : defaultState.teamB.doOrDieCount
      },
      timer: {
        totalDuration: (state?.timer?.totalDuration && typeof state.timer.totalDuration === 'number' && state.timer.totalDuration > 0) ? state.timer.totalDuration : defaultState.timer.totalDuration,
        startTime: (state?.timer?.startTime && (typeof state.timer.startTime === 'number' || state.timer.startTime === null)) ? state.timer.startTime : defaultState.timer.startTime,
        isRunning: (state?.timer?.isRunning && typeof state.timer.isRunning === 'boolean') ? state.timer.isRunning : defaultState.timer.isRunning,
        isPaused: (state?.timer?.isPaused && typeof state.timer.isPaused === 'boolean') ? state.timer.isPaused : defaultState.timer.isPaused,
        pausedAt: (state?.timer?.pausedAt && (typeof state.timer.pausedAt === 'number' || state.timer.pausedAt === null)) ? state.timer.pausedAt : defaultState.timer.pausedAt,
        remainingSeconds: (state?.timer?.remainingSeconds && typeof state.timer.remainingSeconds === 'number' && state.timer.remainingSeconds >= 0) ? state.timer.remainingSeconds : defaultState.timer.remainingSeconds
      },
      subTimer: state?.subTimer ? {
        totalDuration: (state.subTimer?.totalDuration && typeof state.subTimer.totalDuration === 'number' && state.subTimer.totalDuration > 0) ? state.subTimer.totalDuration : defaultState.subTimer!.totalDuration,
        startTime: (state.subTimer?.startTime && (typeof state.subTimer.startTime === 'number' || state.subTimer.startTime === null)) ? state.subTimer.startTime : defaultState.subTimer!.startTime,
        isRunning: (state.subTimer?.isRunning && typeof state.subTimer.isRunning === 'boolean') ? state.subTimer.isRunning : defaultState.subTimer!.isRunning,
        isPaused: (state.subTimer?.isPaused && typeof state.subTimer.isPaused === 'boolean') ? state.subTimer.isPaused : defaultState.subTimer!.isPaused,
        pausedAt: (state.subTimer?.pausedAt && (typeof state.subTimer.pausedAt === 'number' || state.subTimer.pausedAt === null)) ? state.subTimer.pausedAt : defaultState.subTimer!.pausedAt,
        remainingSeconds: (state.subTimer?.remainingSeconds && typeof state.subTimer.remainingSeconds === 'number' && state.subTimer.remainingSeconds >= 0) ? state.subTimer.remainingSeconds : defaultState.subTimer!.remainingSeconds
      } : defaultState.subTimer,
      serverTime: Date.now(),
      lastUpdated: Date.now()
    };

    return repairedState;
  }

  private async saveGameStateWithRetry(maxRetries: number = 3, retryDelay: number = 100): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.gameState.serverTime = Date.now();
        this.gameState.lastUpdated = Date.now();

        // タイマーが実行中の場合、残り時間を更新
        if (this.gameState.timer && this.gameState.timer.isRunning) {
          this.updateRemainingTime();
        }

        // サブタイマーが実行中の場合、残り時間を更新
        if (this.gameState.subTimer && this.gameState.subTimer.isRunning) {
          this.updateSubTimerRemainingTime();
        }

        await this.state.storage.put('gameState', this.gameState);
        console.log(`Game state saved successfully (attempt ${attempt + 1})`);
        return; // 成功した場合は即座に終了

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Save attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries - 1) {
          // 最後の試行でなければ遅延後にリトライ
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    // すべてのリトライが失敗した場合
    console.error(`Failed to save game state after ${maxRetries} attempts. Last error:`, lastError);
    // 最後のエラーを再スローしてコール元に伝播
    throw lastError || new Error('Save failed after all retries');
  }

  private async saveGameState(): Promise<void> {
    try {
      await this.saveGameStateWithRetry();
    } catch (error) {
      // 保存に失敗してもアプリケーションの動作は継続
      console.error('Critical: Game state could not be saved:', error);
      // ここでアラートや他の通知手段を使って問題を報告することもできる
    }
  }

  private async handleAction(action: GameAction): Promise<void> {
    await this.loadGameState(); // 必要に応じて状態を初期化

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

      case 'DO_OR_DIE_UPDATE':
        if (action.team === 'teamA') {
          this.gameState.teamA.doOrDieCount = Math.max(0, Math.min(3, this.gameState.teamA.doOrDieCount + action.delta));
        } else {
          this.gameState.teamB.doOrDieCount = Math.max(0, Math.min(3, this.gameState.teamB.doOrDieCount + action.delta));
        }
        break;

      case 'DO_OR_DIE_RESET':
        this.gameState.teamA.doOrDieCount = 0;
        this.gameState.teamB.doOrDieCount = 0;
        break;

      case 'COURT_CHANGE':
        const tempTeam = {
          name: this.gameState.teamA.name,
          score: this.gameState.teamA.score,
          doOrDieCount: this.gameState.teamA.doOrDieCount
        };

        this.gameState.teamA.name = this.gameState.teamB.name;
        this.gameState.teamA.score = this.gameState.teamB.score;
        this.gameState.teamA.doOrDieCount = this.gameState.teamB.doOrDieCount;

        this.gameState.teamB.name = tempTeam.name;
        this.gameState.teamB.score = tempTeam.score;
        this.gameState.teamB.doOrDieCount = tempTeam.doOrDieCount;
        break;

      case 'RESET_ALL':
        this.gameState.teamA.score = 0;
        this.gameState.teamB.score = 0;
        this.gameState.teamA.doOrDieCount = 0;
        this.gameState.teamB.doOrDieCount = 0;

        this.gameState.timer.startTime = null;
        this.gameState.timer.isRunning = false;
        this.gameState.timer.isPaused = false;
        this.gameState.timer.pausedAt = null;
        this.gameState.timer.remainingSeconds = this.gameState.timer.totalDuration;

        if (this.gameState.subTimer) {
          this.gameState.subTimer.startTime = null;
          this.gameState.subTimer.isRunning = false;
          this.gameState.subTimer.isPaused = false;
          this.gameState.subTimer.pausedAt = null;
          this.gameState.subTimer.remainingSeconds = this.gameState.subTimer.totalDuration;
        }
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
        await this.broadcastState();
        await this.broadcastTimeSync();
        return;

      case 'TIMER_PAUSE':
        if (this.gameState.timer.isRunning) {
          // 現在の残り時間を計算して保存（isRunning = falseにする前に実行）
          this.updateRemainingTime();
          this.gameState.timer.isRunning = false;
          this.gameState.timer.isPaused = true;
          this.gameState.timer.pausedAt = Date.now();
        }
        await this.saveGameState();
        await this.broadcastState();
        await this.broadcastTimeSync();
        return;

      case 'TIMER_RESET':
        this.gameState.timer.startTime = null;
        this.gameState.timer.isRunning = false;
        this.gameState.timer.isPaused = false;
        this.gameState.timer.pausedAt = null;
        this.gameState.timer.remainingSeconds = this.gameState.timer.totalDuration;
        await this.saveGameState();
        await this.broadcastState();
        await this.broadcastTimeSync();
        return;

      case 'TIMER_SET':
        this.gameState.timer.totalDuration = action.duration;
        this.gameState.timer.remainingSeconds = action.duration;
        this.gameState.timer.startTime = null;
        this.gameState.timer.isRunning = false;
        this.gameState.timer.isPaused = false;
        this.gameState.timer.pausedAt = null;
        await this.saveGameState();
        await this.broadcastState();
        await this.broadcastTimeSync();
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
        await this.broadcastState();
        await this.broadcastTimeSync();
        return;

      case 'SUB_TIMER_START':
        if (!this.gameState.subTimer?.isRunning) {
          if (!this.gameState.subTimer) {
            this.gameState.subTimer = {
              totalDuration: 30,
              startTime: null,
              isRunning: false,
              isPaused: false,
              pausedAt: null,
              remainingSeconds: 30
            };
          }
          const now = Date.now();
          if (this.gameState.subTimer.isPaused) {
            // 一時停止からの再開
            const pausedDuration = now - (this.gameState.subTimer.pausedAt || now);
            this.gameState.subTimer.startTime = (this.gameState.subTimer.startTime || now) + pausedDuration;
            this.gameState.subTimer.isPaused = false;
            this.gameState.subTimer.pausedAt = null;
          } else {
            // 新規開始
            this.gameState.subTimer.startTime = now;
          }
          this.gameState.subTimer.isRunning = true;
        }
        await this.saveGameState();
        await this.broadcastState();
        await this.broadcastTimeSync();
        return;

      case 'SUB_TIMER_PAUSE':
        if (this.gameState.subTimer?.isRunning) {
          // 現在の残り時間を計算して保存（isRunning = falseにする前に実行）
          this.updateSubTimerRemainingTime();
          this.gameState.subTimer.isRunning = false;
          this.gameState.subTimer.isPaused = true;
          this.gameState.subTimer.pausedAt = Date.now();
        }
        await this.saveGameState();
        await this.broadcastState();
        await this.broadcastTimeSync();
        return;

      case 'SUB_TIMER_RESET':
        if (!this.gameState.subTimer) {
          this.gameState.subTimer = {
            totalDuration: 30,
            startTime: null,
            isRunning: false,
            isPaused: false,
            pausedAt: null,
            remainingSeconds: 30
          };
        } else {
          this.gameState.subTimer.startTime = null;
          this.gameState.subTimer.isRunning = false;
          this.gameState.subTimer.isPaused = false;
          this.gameState.subTimer.pausedAt = null;
          this.gameState.subTimer.remainingSeconds = this.gameState.subTimer.totalDuration;
        }
        await this.saveGameState();
        await this.broadcastState();
        await this.broadcastTimeSync();
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
    await this.broadcastState();
  }

  private async broadcastState(): Promise<void> {
    await this.loadGameState(); // 状態の存在を保証

    // サーバー時刻を更新
    this.gameState.serverTime = Date.now();

    const message: GameMessage = {
      type: 'game_state',
      data: this.gameState,
      timestamp: Date.now()
    };

    const messageString = JSON.stringify(message);
    const failedConnections: WebSocket[] = [];

    for (const connection of this.connections) {
      try {
        connection.send(messageString);
      } catch (error) {
        console.warn('Failed to broadcast state to connection:', error);
        failedConnections.push(connection);
      }
    }

    // 失敗したコネクションを削除
    for (const connection of failedConnections) {
      await this.safelyDeleteConnection(connection);
    }
  }

  private sendToClient(webSocket: WebSocket, message: GameMessage): void {
    try {
      webSocket.send(JSON.stringify(message));
    } catch (error) {
      console.warn('Failed to send message to client:', error);
      this.connections.delete(webSocket);
    }
  }

  private async safelyDeleteConnection(webSocket: WebSocket): Promise<void> {
    try {
      this.connections.delete(webSocket);
      console.log('WebSocket connection removed, remaining connections:', this.connections.size);

      // 最後のコネクションが削除された場合の処理
      if (this.connections.size === 0) {
        console.log('No active connections remaining, preparing for hibernation');
        // 最終的な状態を保存
        await this.saveGameState();
      }
    } catch (error) {
      console.error('Error during connection cleanup:', error);
    }
  }

  private updateRemainingTime(): void {
    if (this.gameState.timer.startTime && this.gameState.timer.isRunning) {
      const elapsed = (Date.now() - this.gameState.timer.startTime) / 1000;
      this.gameState.timer.remainingSeconds = Math.max(0, this.gameState.timer.totalDuration - elapsed);
    }
  }

  private updateSubTimerRemainingTime(): void {
    if (this.gameState.subTimer?.startTime && this.gameState.subTimer.isRunning) {
      const elapsed = (Date.now() - this.gameState.subTimer.startTime) / 1000;
      this.gameState.subTimer.remainingSeconds = Math.max(0, this.gameState.subTimer.totalDuration - elapsed);
    }
  }

  private async broadcastTimeSync(): Promise<void> {
    const syncData: TimeSyncData = {
      serverTime: Date.now()
    };

    const message: GameMessage = {
      type: 'time_sync',
      data: syncData,
      timestamp: Date.now()
    };

    const messageString = JSON.stringify(message);
    const failedConnections: WebSocket[] = [];

    for (const connection of this.connections) {
      try {
        connection.send(messageString);
      } catch (error) {
        console.warn('Failed to broadcast time sync to connection:', error);
        failedConnections.push(connection);
      }
    }

    // 失敗したコネクションを削除
    for (const connection of failedConnections) {
      await this.safelyDeleteConnection(connection);
    }
  }

  async alarm(): Promise<void> {
    // 接続が残っている場合のみ時刻同期を実行
    if (this.connections.size > 0) {
      await this.broadcastTimeSync();
      // 次のアラームを設定（60秒後）
      await this.state.storage.setAlarm(Date.now() + 60000);
    }
  }
}
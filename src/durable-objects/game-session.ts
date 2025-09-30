// @ts-ignore: ACTION_TYPES is used in switch case statements
import { GameState, GameAction, GameMessage, WebSocketMessage, TimeSyncData, MESSAGE_TYPES, ACTION_TYPES } from '../types/game';
import { isValidScore, isValidDoOrDieCount, clampScore, clampDoOrDieCount } from '../utils/score-logic';

export class GameSession {
  private ctx: DurableObjectState;
  private gameState: GameState;

  constructor(ctx: DurableObjectState) {
    this.ctx = ctx;
    this.gameState = this.getDefaultGameState();
  }

  private getDefaultGameState(): GameState {
    return {
      teamA: { name: 'チームA', score: 0, doOrDieCount: 0 },
      teamB: { name: 'チームB', score: 0, doOrDieCount: 0 },
      timer: {
        totalDuration: 15 * 60, // デフォルト15分
        startTime: null,
        isRunning: false,
        isPaused: false,
        pausedAt: null,
        remainingSeconds: 15 * 60
      },
      subTimer: {
        totalDuration: 30, // 固定30秒
        startTime: null,
        isRunning: false,
        isPaused: false,
        pausedAt: null,
        remainingSeconds: 30
      },
      leftSideTeam: 'teamA', // デフォルトでチームAが左側
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

      // Hibernatable WebSocket API を使用
      this.ctx.acceptWebSocket(server);

      await this.loadGameState();

      // 接続確立後、初期状態とtime_syncメッセージを送信
      this.updateRemainingTime();
      this.updateSubTimerRemainingTime();

      server.send(JSON.stringify({
        type: MESSAGE_TYPES.GAME_STATE,
        data: this.gameState,
        timestamp: Date.now()
      }));

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const messageStr = typeof message === 'string' ? message : new TextDecoder().decode(message);

      // 初回メッセージ受信時の初期化処理
      if (!this.isStateLoaded) {
        await this.loadGameState();
      }

      const parsedMessage: WebSocketMessage = JSON.parse(messageStr);

      if (!parsedMessage.action) {
        throw new Error('Missing action field');
      }

      await this.handleAction(parsedMessage.action);
    } catch (error) {
      console.error('Message processing error:', error);
      ws.send(JSON.stringify({
        type: MESSAGE_TYPES.ERROR,
        data: { error: error instanceof Error ? error.message : 'Unknown error occurred during message processing' },
        timestamp: Date.now()
      }));
    }
  }

  async webSocketClose(_ws: WebSocket, _code: number, _reason: string, _wasClean: boolean): Promise<void> {
    // Hibernatable WebSocket APIでは接続管理はCloudflareが行うため、特別な処理は不要
  }

  async webSocketError(_ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
  }

  private isStateLoaded = false;

  private async loadGameState(): Promise<void> {
    if (this.isStateLoaded) {
      return;
    }

    let needsSave = false;

    try {
      const stored = await this.ctx.storage.get<any>('gameState');

      if (stored) {
        // データ検証を実行
        if (this.validateGameState(stored)) {
          this.gameState = stored;
        } else {
          // 検証失敗の場合は修復を試行
          console.warn('Invalid game state detected, attempting repair');
          this.gameState = this.repairGameState(stored);
          needsSave = true; // 修復後は保存が必要
        }
      } else {
        // 初回アクセス時はデフォルト状態を使用（既に初期化済み）
        needsSave = true; // 新規作成の場合は保存が必要
      }
    } catch (error) {
      // ストレージアクセスエラーの場合はデフォルト状態で継続（既に初期化済み）
      console.error('Failed to load game state from storage:', error);
      needsSave = true; // エラー時も保存してストレージの状態を修復
    }

    this.isStateLoaded = true;
    
    // 必要な場合のみ保存実行
    if (needsSave) {
      await this.saveGameState();
    }
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

    // leftSideTeamの検証
    if (typeof state.leftSideTeam !== 'string' || !['teamA', 'teamB'].includes(state.leftSideTeam)) return false;

    return true;
  }

  private repairGameState(state: any): GameState {
    const defaultState = this.getDefaultGameState();

    const repairedState: GameState = {
      teamA: {
        name: (state?.teamA?.name && typeof state.teamA.name === 'string') ? state.teamA.name : defaultState.teamA.name,
        score: (state?.teamA?.score && typeof state.teamA.score === 'number' && isValidScore(state.teamA.score)) ? state.teamA.score : defaultState.teamA.score,
        doOrDieCount: (state?.teamA?.doOrDieCount && typeof state.teamA.doOrDieCount === 'number' && isValidDoOrDieCount(state.teamA.doOrDieCount)) ? state.teamA.doOrDieCount : defaultState.teamA.doOrDieCount
      },
      teamB: {
        name: (state?.teamB?.name && typeof state.teamB.name === 'string') ? state.teamB.name : defaultState.teamB.name,
        score: (state?.teamB?.score && typeof state.teamB.score === 'number' && isValidScore(state.teamB.score)) ? state.teamB.score : defaultState.teamB.score,
        doOrDieCount: (state?.teamB?.doOrDieCount && typeof state.teamB.doOrDieCount === 'number' && isValidDoOrDieCount(state.teamB.doOrDieCount)) ? state.teamB.doOrDieCount : defaultState.teamB.doOrDieCount
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
      leftSideTeam: (state?.leftSideTeam && typeof state.leftSideTeam === 'string' && ['teamA', 'teamB'].includes(state.leftSideTeam)) ? state.leftSideTeam : defaultState.leftSideTeam,
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

        await this.ctx.storage.put('gameState', this.gameState);
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

  private async handleScoreActions(action: GameAction): Promise<void> {
    switch (action.type) {
      case ACTION_TYPES.SCORE_UPDATE:
        if (action.team === 'teamA') {
          const newScoreA = this.gameState.teamA.score + action.points;
          this.gameState.teamA.score = clampScore(newScoreA);
        } else {
          const newScoreB = this.gameState.teamB.score + action.points;
          this.gameState.teamB.score = clampScore(newScoreB);
        }
        break;

      case ACTION_TYPES.RESET_SCORES:
        this.gameState.teamA.score = 0;
        this.gameState.teamB.score = 0;
        break;

      case ACTION_TYPES.RESET_TEAM_SCORE:
        if (action.team === 'teamA') {
          this.gameState.teamA.score = 0;
        } else if (action.team === 'teamB') {
          this.gameState.teamB.score = 0;
        }
        break;
    }
  }

  private async handleDoOrDieActions(action: GameAction): Promise<void> {
    switch (action.type) {
      case ACTION_TYPES.DO_OR_DIE_UPDATE:
        if (action.team === 'teamA') {
          this.gameState.teamA.doOrDieCount = clampDoOrDieCount(this.gameState.teamA.doOrDieCount + action.delta);
        } else {
          this.gameState.teamB.doOrDieCount = clampDoOrDieCount(this.gameState.teamB.doOrDieCount + action.delta);
        }
        break;

      case ACTION_TYPES.DO_OR_DIE_RESET:
        this.gameState.teamA.doOrDieCount = 0;
        this.gameState.teamB.doOrDieCount = 0;
        break;
    }
  }

  private async handleGameManagementActions(action: GameAction): Promise<boolean> {
    switch (action.type) {
      case ACTION_TYPES.COURT_CHANGE:
        this.changeCourtSides();
        break;

      case ACTION_TYPES.RESET_ALL:
        this.resetAllGame();
        break;

      case ACTION_TYPES.SET_TEAM_NAME:
        this.setTeamName(action.team, action.name);
        break;

      case ACTION_TYPES.GET_GAME_STATE:
        // 状態を変更せず、現在の状態をブロードキャスト
        await this.broadcastState();
        return true; // 処理済みフラグ

      default:
        return false; // 未処理
    }
    return false;
  }

  private async handleTimerActions(action: GameAction): Promise<boolean> {
    switch (action.type) {
      case ACTION_TYPES.TIMER_START:
        await this.startTimer();
        return true;

      case ACTION_TYPES.TIMER_PAUSE:
        await this.pauseTimer();
        return true;

      case ACTION_TYPES.TIMER_RESET:
        await this.resetTimer();
        return true;

      case ACTION_TYPES.TIMER_SET:
        await this.setTimerDuration(action.duration);
        return true;

      case ACTION_TYPES.TIMER_ADJUST:
        await this.adjustTimerTime(action.seconds);
        return true;

      default:
        return false;
    }
  }

  private async handleSubTimerActions(action: GameAction): Promise<boolean> {
    switch (action.type) {
      case ACTION_TYPES.SUB_TIMER_START:
        await this.startSubTimer();
        return true;

      case ACTION_TYPES.SUB_TIMER_PAUSE:
        await this.pauseSubTimer();
        return true;

      case ACTION_TYPES.SUB_TIMER_RESET:
        await this.resetSubTimer();
        return true;

      default:
        return false;
    }
  }


  private async handleAction(action: GameAction): Promise<void> {
    await this.loadGameState(); // 必要に応じて状態を初期化


    // タイマー関連アクションは状態保存・ブロードキャストを内部で行う
    if (await this.handleTimerActions(action)) {
      return;
    }

    // サブタイマー関連アクションは状態保存・ブロードキャストを内部で行う
    if (await this.handleSubTimerActions(action)) {
      return;
    }

    // ゲーム管理アクションをチェック（GET_GAME_STATEは早期リターン）
    if (await this.handleGameManagementActions(action)) {
      return;
    }

    // その他のアクションは状態変更のみ行い、最後に保存・ブロードキャストする
    await this.handleScoreActions(action);
    await this.handleDoOrDieActions(action);

    // 状態保存とブロードキャスト
    await this.saveGameState();
    await this.broadcastState();
  }

  private async broadcastState(): Promise<void> {
    // サーバー時刻を更新
    this.gameState.serverTime = Date.now();

    const message: GameMessage = {
      type: MESSAGE_TYPES.GAME_STATE,
      data: this.gameState,
      timestamp: Date.now()
    };

    const messageString = JSON.stringify(message);
    for (const connection of this.ctx.getWebSockets()) {
      try {
        connection.send(messageString);
      } catch (error) {
        console.warn('Failed to broadcast state to connection:', error);
      }
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

  private async saveAndBroadcast(): Promise<void> {
    await this.saveGameState();
    await this.broadcastState();
  }

  private async startTimer(): Promise<void> {
    if (!this.gameState.timer.isRunning) {
      const now = Date.now();
      if (this.gameState.timer.isPaused) {
        // 一時停止からの再開
        this.gameState.timer.totalDuration = this.gameState.timer.remainingSeconds;
        this.gameState.timer.startTime = now;
        this.gameState.timer.isPaused = false;
        this.gameState.timer.pausedAt = null;
      } else {
        // 新規開始
        this.gameState.timer.totalDuration = this.gameState.timer.remainingSeconds;
        this.gameState.timer.startTime = now;
      }
      this.gameState.timer.isRunning = true;
    }
    await this.saveAndBroadcast();
  }

  private async pauseTimer(): Promise<void> {
    if (this.gameState.timer.isRunning) {
      // 現在の残り時間を計算して保存（isRunning = falseにする前に実行）
      this.updateRemainingTime();
      this.gameState.timer.isRunning = false;
      this.gameState.timer.isPaused = true;
      this.gameState.timer.pausedAt = Date.now();
    }
    await this.saveAndBroadcast();
  }

  private async resetTimer(): Promise<void> {
    this.gameState.timer.startTime = null;
    this.gameState.timer.isRunning = false;
    this.gameState.timer.isPaused = false;
    this.gameState.timer.pausedAt = null;
    this.gameState.timer.remainingSeconds = this.gameState.timer.totalDuration;
    await this.saveAndBroadcast();
  }

  private async setTimerDuration(duration: number): Promise<void> {
    this.gameState.timer.totalDuration = duration;
    this.gameState.timer.remainingSeconds = duration;
    this.gameState.timer.startTime = null;
    this.gameState.timer.isRunning = false;
    this.gameState.timer.isPaused = false;
    this.gameState.timer.pausedAt = null;
    await this.saveAndBroadcast();
  }

  private async adjustTimerTime(seconds: number): Promise<void> {
    if (this.gameState.timer.isRunning) {
      // タイマー実行中の場合、startTimeを調整
      this.gameState.timer.startTime = (this.gameState.timer.startTime || Date.now()) + (seconds * 1000);
    } else {
      // 停止中の場合、remainingSecondsを直接調整
      this.gameState.timer.remainingSeconds = Math.max(0, this.gameState.timer.remainingSeconds + seconds);
    }
    await this.saveAndBroadcast();
  }

  private async startSubTimer(): Promise<void> {
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
    await this.saveAndBroadcast();
  }

  private async pauseSubTimer(): Promise<void> {
    if (this.gameState.subTimer?.isRunning) {
      // 現在の残り時間を計算して保存（isRunning = falseにする前に実行）
      this.updateSubTimerRemainingTime();
      this.gameState.subTimer.isRunning = false;
      this.gameState.subTimer.isPaused = true;
      this.gameState.subTimer.pausedAt = Date.now();
    }
    await this.saveAndBroadcast();
  }

  private async resetSubTimer(): Promise<void> {
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
    await this.saveAndBroadcast();
  }

  private changeCourtSides(): void {
    // チームデータは変更せず、位置だけを切り替える
    // チームのアイデンティティ（色）は維持され、位置のみが変わる
    this.gameState.leftSideTeam = this.gameState.leftSideTeam === 'teamA' ? 'teamB' : 'teamA';
  }

  private resetAllGame(): void {
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

    // コートポジションもデフォルトに戻す
    this.gameState.leftSideTeam = 'teamA';
  }

  private setTeamName(team: 'teamA' | 'teamB', name: string): void {
    if (team === 'teamA') {
      this.gameState.teamA.name = name;
    } else {
      this.gameState.teamB.name = name;
    }
  }

  

  
}
// ゲームアプリケーションのメイン関数
window.gameApp = function(gameId, apis = BrowserAPIs) {
  // デフォルト値の一元管理（Single Source of Truth）
  const DEFAULT_VALUES = {
    teamNames: {
      teamA: 'チームA',
      teamB: 'チームB'
    },
    timer: {
      defaultDuration: 900, // 15分
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

  // UI状態管理の初期化
  const uiState = createUIState(apis);

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

    init() {
      // UI状態管理の初期化
      uiState.initialize();

      // 既存のアニメーション・インターバルをクリアして重複を防止
      if (this.timerAnimationId) {
        apis.timer.cancelAnimationFrame(this.timerAnimationId);
        this.timerAnimationId = null;
      }
      if (this.timeSyncIntervalId) {
        apis.timer.clearInterval(this.timeSyncIntervalId);
        this.timeSyncIntervalId = null;
      }

      this.connectWebSocket();
      // タイマー更新の初期化
      this.updateTimerDisplay();

      // 定期的な時刻同期リクエスト（60秒ごと）
      this.timeSyncIntervalId = apis.timer.setInterval(() => {
        if (this.ws && apis.websocket.getReadyState(this.ws) === apis.websocket.OPEN) {
          this.sendAction({
            type: 'TIME_SYNC_REQUEST',
            clientRequestTime: apis.timer.now()
          });
        }
      }, 60000);
    },

    connectWebSocket() {
      // 既存のWebSocket接続をクリーンアップ
      if (this.ws) {
        apis.websocket.close(this.ws);
        this.ws = null;
      }

      const protocol = apis.window.location.getProtocol() === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${apis.window.location.getHost()}/ws/${this.gameId}`;

      this.ws = apis.websocket.create(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        apis.console.log('WebSocket connected');
        // 接続成功時に初期時刻同期を要求
        this.sendAction({
          type: 'TIME_SYNC_REQUEST',
          clientRequestTime: apis.timer.now()
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'game_state') {
            apis.console.log('Received game state:', message.data);
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

              apis.console.log('Timer updated to:', this.timerSeconds, 'seconds');
            }

            this.updateTimerDisplay();
          }

          else if (message.type === 'time_sync') {
            const clientTime = apis.timer.now();
            const serverTime = message.data.serverTime;
            const rtt = message.data.clientRequestTime ?
              (clientTime - message.data.clientRequestTime) : 0;
            this.serverTimeOffset = serverTime - clientTime + (rtt / 2);
            apis.console.log('Time sync: offset =', this.serverTimeOffset, 'ms, RTT =', rtt, 'ms');
          }

          else if (message.type === 'error') {
            apis.console.error('Server error:', message.data);
          }

        } catch (error) {
          apis.console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        apis.console.log('WebSocket disconnected');
        this.stopTimerUpdate(); // タイマー更新を停止

        // 既存の再接続タイマーをクリア
        if (this.reconnectTimeoutId) {
          apis.timer.clearTimeout(this.reconnectTimeoutId);
          this.reconnectTimeoutId = null;
        }

        // 3秒後に再接続
        this.reconnectTimeoutId = apis.timer.setTimeout(() => this.connectWebSocket(), 3000);
      };

      this.ws.onerror = (error) => {
        apis.console.error('WebSocket error:', error);
        this.connected = false;
        this.stopTimerUpdate(); // タイマー更新を停止
      };
    },

    sendAction(action) {
      if (this.ws && apis.websocket.getReadyState(this.ws) === apis.websocket.OPEN) {
        try {
          apis.websocket.send(this.ws, JSON.stringify({ action }));
          apis.console.log('Sent action:', action);
        } catch (error) {
          apis.console.error('Failed to send action:', error);
        }
      } else {
        apis.console.warn('WebSocket not connected, action not sent:', action);
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
      // 純粋関数を使用してインジケーター生成
      return TimerLogic.generateDoOrDieIndicators(this.gameState.teamA.doOrDieCount);
    },

    get teamBDoOrDieIndicators() {
      // 純粋関数を使用してインジケーター生成
      return TimerLogic.generateDoOrDieIndicators(this.gameState.teamB.doOrDieCount);
    },

    setTeamName(team, name) {
      this.sendAction({
        type: 'SET_TEAM_NAME',
        team: team,
        name: name
      });
    },

    // UI状態管理（ui-stateモジュールに委譲）
    toggleControlPanel() {
      return uiState.toggleControlPanel();
    },

    toggleStatusBar() {
      return uiState.toggleStatusBar();
    },

    toggleSimpleMode() {
      return uiState.toggleSimpleMode();
    },

    // UI状態のgetters
    get showControlPanel() {
      return uiState.get('showControlPanel');
    },

    get showStatusBar() {
      return uiState.get('showStatusBar');
    },

    get simpleMode() {
      return uiState.get('simpleMode');
    },

    get isDesktop() {
      return uiState.get('isDesktop');
    },

    get formattedTimer() {
      // 純粋関数を使用してフォーマット
      return TimerLogic.formatTimer(this.timerSeconds);
    },

    get formattedSubTimer() {
      // 純粋関数を使用してフォーマット
      return TimerLogic.formatSubTimer(this.subTimerSeconds);
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
      apis.console.log('Setting timer to:', minutes, 'minutes,', seconds, 'seconds (', duration, 'total seconds)');
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
          this.timerAnimationId = apis.timer.requestAnimationFrame(updateLoop);
        } catch (error) {
          apis.console.error('Timer update error:', error);
          this.stopTimerUpdate();
        }
      };
      this.timerAnimationId = apis.timer.requestAnimationFrame(updateLoop);
    },

    calculateTimerSeconds() {
      const timer = this.gameState?.timer;
      if (!timer) return;

      // 純粋関数を使用してタイマー計算
      const result = TimerLogic.calculateRemainingSeconds(timer, this.serverTimeOffset);
      this.timerSeconds = result.seconds;
      this.timerRunning = result.isRunning;
    },

    calculateSubTimerSeconds() {
      const subTimer = this.gameState?.subTimer;
      if (!subTimer) return;

      // 純粋関数を使用してサブタイマー計算
      const result = TimerLogic.calculateSubTimerRemainingSeconds(subTimer, this.serverTimeOffset);
      this.subTimerSeconds = result.seconds;
      this.subTimerRunning = result.isRunning;
    },

    stopTimerUpdate() {
      if (this.timerAnimationId) {
        apis.timer.cancelAnimationFrame(this.timerAnimationId);
        this.timerAnimationId = null;
      }
    },

    cleanup() {
      // UI状態管理のクリーンアップ
      if (uiState) {
        uiState.cleanup();
      }

      // 全てのアニメーション・インターバルをクリア
      if (this.timerAnimationId) {
        apis.timer.cancelAnimationFrame(this.timerAnimationId);
        this.timerAnimationId = null;
      }
      if (this.timeSyncIntervalId) {
        apis.timer.clearInterval(this.timeSyncIntervalId);
        this.timeSyncIntervalId = null;
      }

      // 再接続タイマーをクリア
      if (this.reconnectTimeoutId) {
        apis.timer.clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }

      // WebSocket接続をクローズ
      if (this.ws) {
        apis.websocket.close(this.ws);
        this.ws = null;
      }

      this.connected = false;
    },

    // QRモーダル表示 (グローバル関数を呼び出す)
    openQRModal() {
      window.openQRModal();
    }
  };
};
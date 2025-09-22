// ゲームアプリケーションのメイン関数
window.gameApp = function(gameId, apis = BrowserAPIs) {
  // 定数管理モジュールの使用
  const { DEFAULT_VALUES, ACTIONS } = Constants;

  // UI状態管理の初期化
  const uiState = createUIState(apis);

  // 入力フィールド管理の初期化
  const inputFields = createInputFields(apis, DEFAULT_VALUES);

  // アクション作成ヘルパーの初期化
  const actionCreators = createActionCreators(Constants);

  // WebSocket管理の初期化
  const websocketManager = createWebSocketManager(apis, Constants);

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
    gameId: gameId,
    timerSeconds: DEFAULT_VALUES.timer.defaultDuration,
    timerRunning: false,
    subTimerSeconds: 30,
    subTimerRunning: false,
    timerAnimationId: null,
    websocketManager: websocketManager,

    init() {
      // UI状態管理の初期化
      uiState.initialize();

      // 既存のアニメーション・インターバルをクリアして重複を防止
      if (this.timerAnimationId) {
        apis.timer.cancelAnimationFrame(this.timerAnimationId);
        this.timerAnimationId = null;
      }

      // WebSocket接続を開始
      this.websocketManager.connect(this.gameId, {
        onConnected: () => {
          apis.console.log('Game app: WebSocket connected');
        },
        onDisconnected: () => {
          apis.console.log('Game app: WebSocket disconnected');
          this.stopTimerUpdate(); // タイマー更新を停止
        },
        onGameStateReceived: (gameState) => {
          this.gameState = gameState;

          // 入力フィールドをサーバー状態と同期
          inputFields.syncWithGameState(this.gameState);

          // タイマーが停止している場合、直接値を更新
          if (this.gameState.timer && !this.gameState.timer.isRunning) {
            this.timerSeconds = Math.floor(this.gameState.timer.remainingSeconds);
            apis.console.log('Timer updated to:', this.timerSeconds, 'seconds');
          }

          this.updateTimerDisplay();
        },
        onTimeSyncReceived: (syncData) => {
          // 時刻同期データをwebsocketManagerから取得
        },
        onError: (type, error) => {
          apis.console.error('WebSocket error:', type, error);
        }
      });

      // タイマー更新の初期化
      this.updateTimerDisplay();
    },


    updateScore(team, points) {
      this.websocketManager.sendAction({
        type: 'SCORE_UPDATE',
        team: team,
        points: points
      });
    },

    resetScores() {
      this.websocketManager.sendAction(actionCreators.score.reset());
    },

    courtChange() {
      this.websocketManager.sendAction({ type: 'COURT_CHANGE' });
    },

    resetAll() {
      this.websocketManager.sendAction({ type: 'RESET_ALL' });
    },

    updateDoOrDie(team, delta) {
      this.websocketManager.sendAction({
        type: 'DO_OR_DIE_UPDATE',
        team: team,
        delta: delta
      });
    },

    resetDoOrDie() {
      this.websocketManager.sendAction(actionCreators.doOrDie.reset());
    },

    get teamADoOrDieIndicators() {
      // 純粋関数を使用してインジケーター生成
      return ScoreLogic.generateDoOrDieIndicators(this.gameState.teamA.doOrDieCount);
    },

    get teamBDoOrDieIndicators() {
      // 純粋関数を使用してインジケーター生成
      return ScoreLogic.generateDoOrDieIndicators(this.gameState.teamB.doOrDieCount);
    },

    setTeamName(team, name) {
      this.websocketManager.sendAction({
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

    // 入力フィールドのgetters
    get timerInputMinutes() {
      return inputFields.get('timerInputMinutes');
    },

    get timerInputSeconds() {
      return inputFields.get('timerInputSeconds');
    },

    get teamANameInput() {
      return inputFields.get('teamANameInput');
    },

    get teamBNameInput() {
      return inputFields.get('teamBNameInput');
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
      this.websocketManager.sendAction(actionCreators.timer.start());
    },

    stopTimer() {
      this.websocketManager.sendAction(actionCreators.timer.pause());
    },

    adjustTimer(seconds) {
      this.websocketManager.sendAction({
        type: 'TIMER_ADJUST',
        seconds: seconds
      });
    },

    setTimer(minutes, seconds) {
      const duration = (minutes * 60) + seconds;
      apis.console.log('Setting timer to:', minutes, 'minutes,', seconds, 'seconds (', duration, 'total seconds)');
      this.websocketManager.sendAction({
        type: 'TIMER_SET',
        duration: duration
      });
    },

    setTimerPreset(presetKey) {
      const result = inputFields.setTimerPreset(presetKey);
      if (result.success) {
        this.setTimer(result.minutes, 0);
      }
      return result;
    },

    resetTimer() {
      this.websocketManager.sendAction(actionCreators.timer.reset());
    },

    startSubTimer() {
      this.websocketManager.sendAction({ type: 'SUB_TIMER_START' });
    },

    stopSubTimer() {
      this.websocketManager.sendAction({ type: 'SUB_TIMER_PAUSE' });
    },

    resetSubTimer() {
      this.websocketManager.sendAction({ type: 'SUB_TIMER_RESET' });
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
      const serverTimeOffset = this.websocketManager.getServerTimeOffset();
      const result = TimerLogic.calculateRemainingSeconds(timer, serverTimeOffset);
      this.timerSeconds = result.seconds;
      this.timerRunning = result.isRunning;
    },

    calculateSubTimerSeconds() {
      const subTimer = this.gameState?.subTimer;
      if (!subTimer) return;

      // 純粋関数を使用してサブタイマー計算
      const serverTimeOffset = this.websocketManager.getServerTimeOffset();
      const result = TimerLogic.calculateSubTimerRemainingSeconds(subTimer, serverTimeOffset);
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

      // WebSocket管理のクリーンアップ
      if (this.websocketManager) {
        this.websocketManager.cleanup();
      }

      // タイマーアニメーションをクリア
      if (this.timerAnimationId) {
        apis.timer.cancelAnimationFrame(this.timerAnimationId);
        this.timerAnimationId = null;
      }
    },

    // QRモーダル表示 (グローバル関数を呼び出す)
    openQRModal() {
      window.openQRModal();
    }
  };
};
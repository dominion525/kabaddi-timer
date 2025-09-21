export const gameAppScript = `
// ゲームアプリケーションのメイン関数
function gameApp(gameId) {
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
    simpleMode: false,
    timerSeconds: DEFAULT_VALUES.timer.defaultDuration,
    timerRunning: false,
    subTimerSeconds: 30,
    subTimerRunning: false,
    serverTimeOffset: 0,
    timerAnimationId: null,
    timeSyncIntervalId: null,
    reconnectTimeoutId: null,
    lastSyncRequest: 0,
    timerInputMinutes: DEFAULT_VALUES.timer.presetMinutes.medium,
    timerInputSeconds: 0,
    teamANameInput: DEFAULT_VALUES.teamNames.teamA,
    teamBNameInput: DEFAULT_VALUES.teamNames.teamB,
    isDesktop: window.matchMedia('(min-width: 768px)').matches,

    init() {
      // localStorageからsimpleModeを読み込み
      const savedSimpleMode = localStorage.getItem('kabaddi-timer-simple-mode');
      if (savedSimpleMode !== null) {
        this.simpleMode = JSON.parse(savedSimpleMode);
      }

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
              this.timerInputSeconds = Math.floor(this.gameState.timer.remainingSeconds % 60);

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

    toggleSimpleMode() {
      this.simpleMode = !this.simpleMode;
      localStorage.setItem('kabaddi-timer-simple-mode', JSON.stringify(this.simpleMode));
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
    },

    // QRモーダル表示 (グローバル関数を呼び出す)
    openQRModal() {
      window.openQRModal();
    }
  };
}

// グローバルに公開
window.gameApp = gameApp;
`;
// ゲームアプリケーションのメイン関数
function gameApp(gameId: string) {
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
    ws: null as WebSocket | null,
    gameId: gameId,
    showControlPanel: false,
    showStatusBar: true,
    simpleMode: false,
    scrollLockEnabled: true,
    timerSeconds: DEFAULT_VALUES.timer.defaultDuration,
    timerRunning: false,
    subTimerSeconds: 30,
    subTimerRunning: false,
    serverTimeOffset: 0,
    timerAnimationId: null as number | null,
    timeSyncIntervalId: null as number | null,
    reconnectTimeoutId: null as number | null,
    lastSyncRequest: 0,
    timerInputMinutes: DEFAULT_VALUES.timer.presetMinutes.medium,
    timerInputSeconds: 0,
    teamANameInput: DEFAULT_VALUES.teamNames.teamA,
    teamBNameInput: DEFAULT_VALUES.teamNames.teamB,
    isDesktop: (window as any).matchMedia('(min-width: 768px)').matches,
    showQRModal: false,
    gameUrl: '',
    gameIdText: '',

    init() {
      // localStorageからsimpleModeを読み込み
      const savedSimpleMode = localStorage.getItem('kabaddi-timer-simple-mode');
      if (savedSimpleMode !== null) {
        this.simpleMode = JSON.parse(savedSimpleMode);
      }

      // localStorageからscrollLockEnabledを読み込み
      const savedScrollLock = localStorage.getItem('kabaddi-timer-scroll-lock');
      if (savedScrollLock !== null) {
        this.scrollLockEnabled = JSON.parse(savedScrollLock);
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

      // QRモーダル関連の初期化
      this.gameUrl = window.location.href;
      this.gameIdText = this.gameId;

      this.connectWebSocket();
      // タイマー更新の初期化
      this.updateTimerDisplay();

      // 画面サイズ変更監視
      const mediaQuery = (window as any).matchMedia('(min-width: 768px)');
      const handleMediaChange = (e: MediaQueryListEvent) => {
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
      }, 60000) as any;

      // Lucide アイコンを初期化
      if (typeof (window as any).lucide !== 'undefined') {
        (window as any).lucide.createIcons();
      }

      // チーム名入力の監視
      (this as any).$watch('teamANameInput', (newValue: string) => {
        this.setTeamName('teamA', newValue);
      });
      (this as any).$watch('teamBNameInput', (newValue: string) => {
        this.setTeamName('teamB', newValue);
      });
    },

    connectWebSocket() {
      // 既存のWebSocket接続をクリーンアップ
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${this.gameId}`;

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

      this.ws.onmessage = (event: MessageEvent) => {
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
        this.reconnectTimeoutId = setTimeout(() => this.connectWebSocket(), 3000) as any;
      };

      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        this.connected = false;
        this.stopTimerUpdate(); // タイマー更新を停止
      };
    },

    sendAction(action: any) {
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

    updateScore(team: string, points: number) {
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

    updateDoOrDie(team: string, delta: number) {
      this.sendAction({
        type: 'DO_OR_DIE_UPDATE',
        team: team,
        delta: delta
      });
    },

    resetDoOrDie() {
      this.sendAction(ACTIONS.DO_OR_DIE_RESET);
    },

    resetTeamDoOrDie(team: string) {
      const currentCount = (this.gameState as any)[team].doOrDieCount;
      if (currentCount > 0) {
        this.updateDoOrDie(team, -currentCount);
      }
    },

    get teamADoOrDieIndicators() {
      // 純粋関数を使用してインジケーター生成
      return (window as any).ScoreLogic.generateDoOrDieIndicators(this.gameState.teamA.doOrDieCount);
    },

    get teamBDoOrDieIndicators() {
      // 純粋関数を使用してインジケーター生成
      return (window as any).ScoreLogic.generateDoOrDieIndicators(this.gameState.teamB.doOrDieCount);
    },

    get controlPanelButtonText() {
      return this.showControlPanel ? '▼ 閉じる' : '▲ コントロール';
    },

    setTeamName(team: string, name: string) {
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

    toggleScrollLock() {
      this.scrollLockEnabled = !this.scrollLockEnabled;
      localStorage.setItem('kabaddi-timer-scroll-lock', JSON.stringify(this.scrollLockEnabled));
    },

    get formattedTimer() {
      // 純粋関数を使用してフォーマット
      return (window as any).TimerLogic.formatTimer(this.timerSeconds);
    },

    get formattedSubTimer() {
      // 純粋関数を使用してフォーマット
      return (window as any).TimerLogic.formatSubTimer(this.subTimerSeconds);
    },

    startTimer() {
      this.sendAction(ACTIONS.TIMER_START);
    },

    stopTimer() {
      this.sendAction(ACTIONS.TIMER_PAUSE);
    },

    adjustTimer(seconds: number) {
      this.sendAction({
        type: 'TIMER_ADJUST',
        seconds: seconds
      });
    },

    setTimer(minutes: number, seconds: number) {
      const duration = (minutes * 60) + seconds;
      console.log('Setting timer to:', minutes, 'minutes,', seconds, 'seconds (', duration, 'total seconds)');
      this.sendAction({
        type: 'TIMER_SET',
        duration: duration
      });
    },

    setTimerPreset(presetKey: string) {
      const minutes = (DEFAULT_VALUES.timer.presetMinutes as any)[presetKey];
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

      // 純粋関数を使用してタイマー計算
      const result = (window as any).TimerLogic.calculateRemainingSeconds(timer, this.serverTimeOffset);
      this.timerSeconds = result.seconds;
      this.timerRunning = result.isRunning;
    },

    calculateSubTimerSeconds() {
      const subTimer = (this.gameState as any)?.subTimer;
      if (!subTimer) return;

      // 純粋関数を使用してサブタイマー計算
      const result = (window as any).TimerLogic.calculateSubTimerRemainingSeconds(subTimer, this.serverTimeOffset);
      this.subTimerSeconds = result.seconds;
      this.subTimerRunning = result.isRunning;
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

    // QRモーダル表示
    openQRModal() {
      this.showQRModal = true;
      // QRコードを生成
      (this as any).$nextTick(() => {
        this.generateQRCode();
        // Lucide iconsを再初期化
        if (typeof (window as any).lucide !== 'undefined') {
          (window as any).lucide.createIcons();
        }
      });
    },

    // QRモーダル閉じる
    closeQRModal() {
      this.showQRModal = false;
    },

    // QRコード生成
    generateQRCode() {
      const canvas = document.getElementById('qrCanvas') as HTMLCanvasElement;
      if (!canvas) return;

      try {
        if (typeof (window as any).QRious !== 'undefined') {
          new (window as any).QRious({
            element: canvas,
            value: this.gameUrl,
            size: 200,
            level: 'M'
          });
          console.log('QRコード生成成功');
        } else {
          console.error('QRiousライブラリが読み込まれていません');
          this.showQRFallback(canvas);
        }
      } catch (error) {
        console.error('QRコード生成エラー:', error);
        this.showQRFallback(canvas);
      }
    },

    // QRコード生成失敗時のフォールバック表示
    showQRFallback(canvas: HTMLCanvasElement) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 200;
      canvas.height = 200;
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QRコードが生成できません', 100, 90);
      ctx.fillText('URLをコピーしてください', 100, 110);
    },

    // ゲームIDをコピー
    copyGameId() {
      navigator.clipboard.writeText(this.gameIdText).then(() => {
        alert('ゲームIDをクリップボードにコピーしました');
      }).catch((err) => {
        console.error('ゲームIDコピーエラー:', err);
        // フォールバック: テキストエリアを使用
        const textArea = document.createElement('textarea');
        textArea.value = this.gameIdText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('ゲームIDをクリップボードにコピーしました');
      });
    },

    // ゲームURLをコピー
    copyGameURL() {
      navigator.clipboard.writeText(this.gameUrl).then(() => {
        alert('URLをクリップボードにコピーしました');
      }).catch((err) => {
        console.error('URLコピーエラー:', err);
        // フォールバック: テキストエリアを使用
        const textArea = document.createElement('textarea');
        textArea.value = this.gameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('URLをクリップボードにコピーしました');
      });
    }
  };
}

// グローバルに公開
(window as any).gameApp = gameApp;
// ゲームアプリケーションのメイン関数
function gameApp(gameId: string) {
  // 依存モジュールの取得
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const timerLogic = (window as any).TimerLogic;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scoreLogic = (window as any).ScoreLogic;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const constants = (window as any).Constants;

  // 定数の取得
  const DEFAULT_VALUES = constants.DEFAULT_VALUES;
  const ACTIONS = constants.ACTIONS;
  const MESSAGE_TYPES = constants.MESSAGE_TYPES;
  const STORAGE_KEYS = constants.STORAGE_KEYS;

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
      subTimer: {
        totalDuration: DEFAULT_VALUES.subTimer.defaultDuration,
        startTime: null,
        isRunning: false,
        isPaused: false,
        pausedAt: null,
        remainingSeconds: DEFAULT_VALUES.subTimer.defaultDuration
      },
      serverTime: 0,
      lastUpdated: 0
    },
    connected: false,
    connectionStatus: 'disconnected' as 'connected' | 'disconnected' | 'connecting' | 'reconnecting',
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
    // 時刻同期状態管理
    timeSyncStatus: 'unknown' as 'good' | 'warning' | 'error' | 'unknown',
    lastRTT: 0,
    lastSyncTime: null as Date | null,
    showTimeSyncModal: false,
    currentClientTime: '',
    currentServerTime: '',
    timeDisplayIntervalId: null as number | null,
    timerAnimationId: null as number | null,
    timeSyncIntervalId: null as number | null,
    reconnectTimeoutId: null as number | null,
    lastSyncRequest: 0,
    lastActivityTime: 0,
    idleTimeoutId: null as number | null,
    // 通信アクティビティ表示用フラグ
    sendingData: false,
    receivingData: false,
    sendingAnimationTimeout: null as number | null,
    receivingAnimationTimeout: null as number | null,
    timerInputMinutes: DEFAULT_VALUES.timer.presetMinutes.medium,
    timerInputSeconds: 0,
    teamANameInput: DEFAULT_VALUES.teamNames.teamA,
    teamBNameInput: DEFAULT_VALUES.teamNames.teamB,
    isDesktop: (window as any).matchMedia('(min-width: 768px)').matches,
    showQRModal: false,
    showCreditsModal: false,
    modalType: '', // 'qr' または 'credits'
    gameUrl: '',
    gameIdText: '',
    // ローカル表示反転状態（審判向けスマホ表示用）
    displayFlipped: false,

    init() {
      console.log('📌 File version: 2024-09-27-v2 with debug logs and cache fix');

      // localStorageからsimpleModeを読み込み
      const savedSimpleMode = localStorage.getItem(STORAGE_KEYS.simpleMode);
      if (savedSimpleMode !== null) {
        this.simpleMode = JSON.parse(savedSimpleMode);
      }

      // localStorageからscrollLockEnabledを読み込み
      const savedScrollLock = localStorage.getItem(STORAGE_KEYS.scrollLock);
      if (savedScrollLock !== null) {
        this.scrollLockEnabled = JSON.parse(savedScrollLock);
      }

      // localStorageからdisplayFlippedを読み込み
      const savedDisplayFlipped = localStorage.getItem(STORAGE_KEYS.displayFlippedPrefix + this.gameId);
      if (savedDisplayFlipped !== null) {
        this.displayFlipped = JSON.parse(savedDisplayFlipped);
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

      // 接続中状態に設定
      this.connectionStatus = 'connecting';

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${this.gameId}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.connectionStatus = 'connected';
        console.log('WebSocket connected');
        // 接続成功時にゲーム状態取得を要求（即座に初回同期）
        this.sendAction(ACTIONS.GET_GAME_STATE);

        // アイドル時同期タイマーを開始
        this.resetIdleTimer();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === MESSAGE_TYPES.GAME_STATE) {
            console.log('Received game state:', message.data);

            // ゲーム状態を設定（タイマーは後で調整）
            this.gameState = message.data;
            const clientTime = Date.now();

            // 時刻同期計算（GET_GAME_STATEレスポンスで正確に計算）
            if (this.lastSyncRequest > 0) {
              // 正確なRTT計算（リクエスト送信から応答受信まで）
              const rtt = clientTime - this.lastSyncRequest;
              this.lastRTT = Math.max(0, rtt);

              // サーバー時刻オフセット計算（片道遅延で補正）
              if (this.gameState.serverTime) {
                const halfRtt = rtt / 2;
                const estimatedServerReceiveTime = clientTime - halfRtt;
                this.serverTimeOffset = this.gameState.serverTime - estimatedServerReceiveTime;
              }

              // 同期時刻を更新
              this.lastSyncTime = new Date();

              // 同期状態を更新
              this.updateTimeSyncStatus();

              // 同期リクエスト時刻をリセット
              this.lastSyncRequest = 0;
            }

            // タイマーが実行中の場合、相対時間計算のためstartTimeをクライアント時刻に置換
            if (this.gameState.timer && this.gameState.timer.isRunning && this.gameState.timer.startTime) {
              console.log('Adjusting timer startTime for relative calculation:', {
                originalStartTime: this.gameState.timer.startTime,
                remainingSeconds: this.gameState.timer.remainingSeconds,
                clientTime: clientTime
              });
              // startTimeを「同期受信時のクライアント時刻」に置き換えて相対時間計算を有効にする
              (this.gameState.timer as any).startTime = clientTime;
            }

            // サブタイマーも同様の処理
            const subTimer = (this.gameState as any).subTimer;
            if (subTimer && subTimer.isRunning && subTimer.startTime) {
              console.log('Adjusting subTimer startTime for relative calculation:', {
                originalStartTime: subTimer.startTime,
                remainingSeconds: subTimer.remainingSeconds,
                clientTime: clientTime
              });
              // startTimeを「同期受信時のクライアント時刻」に置き換えて相対時間計算を有効にする
              subTimer.startTime = clientTime;
            }

            // ローカルのチーム名入力をサーバーの値で同期（フォーカス中の要素は除く）
            const activeElement = document.activeElement as HTMLInputElement;
            const isTeamAFocused = activeElement && activeElement.matches('input[x-model="teamANameInput"]');
            const isTeamBFocused = activeElement && activeElement.matches('input[x-model="teamBNameInput"]');

            if (!isTeamAFocused) {
              this.teamANameInput = this.gameState.teamA.name;
            }
            if (!isTeamBFocused) {
              this.teamBNameInput = this.gameState.teamB.name;
            }

            // タイマーが停止している場合、直接値を更新
            if (this.gameState.timer && !this.gameState.timer.isRunning) {
              this.timerSeconds = Math.floor(this.gameState.timer.remainingSeconds);

              // タイマー入力値も同期
              this.timerInputMinutes = Math.floor(this.gameState.timer.remainingSeconds / 60);
              this.timerInputSeconds = Math.floor(this.gameState.timer.remainingSeconds % 60);

              console.log('Timer updated to:', this.timerSeconds, 'seconds');
            }

            this.updateTimerDisplay();

            // 受信アニメーション（ゲーム状態更新時）
            console.log('🟡 About to call triggerReceivingAnimation, function exists:', typeof this.triggerReceivingAnimation);
            if (typeof this.triggerReceivingAnimation === 'function') {
              this.triggerReceivingAnimation();
            } else {
              console.error('🔴 triggerReceivingAnimation is not a function!', this.triggerReceivingAnimation);
            }

            // メッセージ受信時にアイドルタイマーをリセット
            this.resetIdleTimer();
          }


          else if (message.type === MESSAGE_TYPES.ERROR) {
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

        // 再接続中状態に設定し、3秒後に再接続
        this.connectionStatus = 'reconnecting';
        this.reconnectTimeoutId = setTimeout(() => this.connectWebSocket(), 3000) as any;
      };

      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        this.connected = false;
        // onerrorでは状態を変更しない（oncloseで処理される）
        this.stopTimerUpdate(); // タイマー更新を停止
      };
    },

    sendAction(action: any) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          // GET_GAME_STATEアクション送信時に時刻を記録（RTT計算用）
          if (action.type === 'GET_GAME_STATE') {
            this.lastSyncRequest = Date.now();
          }

          // すべての送信でアニメーション表示
          console.log('🟡 About to call triggerSendingAnimation, function exists:', typeof this.triggerSendingAnimation);
          if (typeof this.triggerSendingAnimation === 'function') {
            this.triggerSendingAnimation();
          } else {
            console.error('🔴 triggerSendingAnimation is not a function!', this.triggerSendingAnimation);
          }

          this.ws.send(JSON.stringify({ action }));
          console.log('Sent action:', action);

          // アクション送信時にアイドルタイマーをリセット
          this.resetIdleTimer();
        } catch (error) {
          console.error('Failed to send action:', error);
        }
      } else {
        console.warn('WebSocket not connected, action not sent:', action);
      }
    },

    updateScore(team: string, points: number) {
      this.sendAction({
        ...ACTIONS.SCORE_UPDATE,
        team: team,
        points: points
      });
    },

    resetScores() {
      this.sendAction(ACTIONS.RESET_SCORES);
    },

    resetTeamScore(team: 'teamA' | 'teamB') {
      this.sendAction({
        type: ACTIONS.RESET_TEAM_SCORE,
        team: team
      });
    },

    courtChange() {
      this.sendAction(ACTIONS.COURT_CHANGE);
    },

    resetAll() {
      this.sendAction(ACTIONS.RESET_ALL);
    },

    updateDoOrDie(team: string, delta: number) {
      this.sendAction({
        ...ACTIONS.DO_OR_DIE_UPDATE,
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
      return scoreLogic.generateDoOrDieIndicators(this.gameState.teamA.doOrDieCount);
    },

    get teamBDoOrDieIndicators() {
      // 純粋関数を使用してインジケーター生成
      return scoreLogic.generateDoOrDieIndicators(this.gameState.teamB.doOrDieCount);
    },

    get controlPanelButtonText() {
      return this.showControlPanel ? '▼ 閉じる' : '▲ コントロール';
    },

    setTeamName(team: string, name: string) {
      this.sendAction({
        ...ACTIONS.SET_TEAM_NAME,
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
      localStorage.setItem(STORAGE_KEYS.simpleMode, JSON.stringify(this.simpleMode));
    },

    toggleScrollLock() {
      this.scrollLockEnabled = !this.scrollLockEnabled;
      localStorage.setItem(STORAGE_KEYS.scrollLock, JSON.stringify(this.scrollLockEnabled));
    },

    get formattedTimer() {
      // 純粋関数を使用してフォーマット
      return timerLogic.formatTimer(this.timerSeconds);
    },

    get formattedSubTimer() {
      // 純粋関数を使用してフォーマット
      return timerLogic.formatSubTimer(this.subTimerSeconds);
    },

    startTimer() {
      this.sendAction(ACTIONS.TIMER_START);
    },

    stopTimer() {
      this.sendAction(ACTIONS.TIMER_PAUSE);
    },

    adjustTimer(seconds: number) {
      this.sendAction({
        ...ACTIONS.TIMER_ADJUST,
        seconds: seconds
      });
    },

    setTimer(minutes: number, seconds: number) {
      const duration = (minutes * 60) + seconds;
      console.log('Setting timer to:', minutes, 'minutes,', seconds, 'seconds (', duration, 'total seconds)');
      this.sendAction({
        ...ACTIONS.TIMER_SET,
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
      this.sendAction(ACTIONS.SUB_TIMER_START);
    },

    stopSubTimer() {
      this.sendAction(ACTIONS.SUB_TIMER_PAUSE);
    },

    resetSubTimer() {
      this.sendAction(ACTIONS.SUB_TIMER_RESET);
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
      const result = timerLogic.calculateRemainingSeconds(timer, this.serverTimeOffset);
      this.timerSeconds = result.seconds;
      this.timerRunning = result.isRunning;
    },

    calculateSubTimerSeconds() {
      const subTimer = (this.gameState as any)?.subTimer;
      if (!subTimer) return;

      // 純粋関数を使用してサブタイマー計算
      const result = timerLogic.calculateSubTimerRemainingSeconds(subTimer, this.serverTimeOffset);
      this.subTimerSeconds = result.seconds;
      this.subTimerRunning = result.isRunning;
    },

    stopTimerUpdate() {
      if (this.timerAnimationId) {
        cancelAnimationFrame(this.timerAnimationId);
        this.timerAnimationId = null;
      }
    },

    // 時刻同期状態を判定・更新
    updateTimeSyncStatus() {
      const absOffset = Math.abs(this.serverTimeOffset);
      const rtt = this.lastRTT;

      // 判定基準
      if (rtt > 1000 || absOffset > 3000) {
        this.timeSyncStatus = 'error';
      } else if (rtt > 500 || absOffset > 1000) {
        this.timeSyncStatus = 'warning';
      } else {
        this.timeSyncStatus = 'good';
      }
    },

    // 時刻同期モーダルを開く
    openTimeSyncModal() {
      this.showTimeSyncModal = true;
      this.updateTimeDisplay();
    },

    // 時刻表示を更新
    updateTimeDisplay() {
      const now = new Date();
      const serverNow = new Date(now.getTime() + this.serverTimeOffset);

      this.currentClientTime = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');
      this.currentServerTime = serverNow.toLocaleTimeString() + '.' + String(serverNow.getMilliseconds()).padStart(3, '0');
    },

    // 時刻同期モーダルを閉じる
    closeTimeSyncModal() {
      this.showTimeSyncModal = false;
    },

    // 手動で時刻同期を要求
    requestTimeSync() {
      // GET_GAME_STATEを送信して時刻同期を実行
      this.sendAction(ACTIONS.GET_GAME_STATE);

      // 時刻表示を即座に更新
      this.updateTimeDisplay();
    },

    // タイマー動作中のアイドル時同期タイマー管理
    resetIdleTimer() {
      // アクティビティ時刻を記録
      this.lastActivityTime = Date.now();

      // 既存のアイドルタイマーをクリア
      if (this.idleTimeoutId) {
        clearTimeout(this.idleTimeoutId);
        this.idleTimeoutId = null;
      }

      // タイマー動作中のみアイドル同期を設定
      if (this.gameState?.timer?.isRunning || this.gameState?.subTimer?.isRunning) {
        // 5-10秒後に同期（10秒ハイバネーション閾値をカバー）
        const idleDelay = 5000 + Math.random() * 5000;
        console.log(`Timer running - setting idle sync after ${Math.round(idleDelay / 1000)}s`);

        this.idleTimeoutId = setTimeout(() => {
          this.sendAction(ACTIONS.GET_GAME_STATE);
          this.resetIdleTimer(); // 再度チェック
        }, idleDelay) as any;
      } else {
        console.log('Timer stopped - no idle sync needed (hibernation allowed)');
      }
    },

    // 通信アクティビティアニメーション

    /**
     * 送信アニメーション（パルスエフェクト）を開始
     */
    triggerSendingAnimation() {
      console.log('🔵 Sending animation triggered');

      // 既存のアニメーションタイマーをクリア
      if (this.sendingAnimationTimeout) {
        clearTimeout(this.sendingAnimationTimeout);
        this.sendingAnimationTimeout = null;
      }

      // フラグを設定（0.3秒間）
      this.sendingData = true;
      console.log('🔵 sendingData = true');

      this.sendingAnimationTimeout = setTimeout(() => {
        this.sendingData = false;
        console.log('🔵 sendingData = false (timeout)');
        this.sendingAnimationTimeout = null;
      }, 300) as any;
    },

    /**
     * 受信アニメーション（フラッシュエフェクト）を開始
     */
    triggerReceivingAnimation() {
      console.log('🟢 Receiving animation triggered');

      // 既存のアニメーションタイマーをクリア
      if (this.receivingAnimationTimeout) {
        clearTimeout(this.receivingAnimationTimeout);
        this.receivingAnimationTimeout = null;
      }

      // フラグを設定（0.2秒間）
      this.receivingData = true;
      console.log('🟢 receivingData = true');

      this.receivingAnimationTimeout = setTimeout(() => {
        this.receivingData = false;
        console.log('🟢 receivingData = false (timeout)');
        this.receivingAnimationTimeout = null;
      }, 200) as any;
    },

    // コートチェンジ関連のヘルパーメソッド

    /**
     * 左側にいるチームのIDを取得
     */
    getLeftTeamId(): 'teamA' | 'teamB' {
      return (this.gameState as any).leftSideTeam || 'teamA';
    },

    /**
     * 右側にいるチームのIDを取得
     */
    getRightTeamId(): 'teamA' | 'teamB' {
      return this.getLeftTeamId() === 'teamA' ? 'teamB' : 'teamA';
    },

    /**
     * 左側にいるチームのデータを取得
     */
    getLeftTeam() {
      const teamId = this.getLeftTeamId();
      return (this.gameState as any)[teamId];
    },

    /**
     * 右側にいるチームのデータを取得
     */
    getRightTeam() {
      const teamId = this.getRightTeamId();
      return (this.gameState as any)[teamId];
    },

    /**
     * 指定されたチームが左側にいるかを判定
     */
    isTeamOnLeft(teamId: 'teamA' | 'teamB'): boolean {
      return this.getLeftTeamId() === teamId;
    },

    /**
     * チームの設定（色など）を取得
     */
    getTeamConfig(teamId: 'teamA' | 'teamB') {
      return constants?.TEAM_CONFIG?.[teamId] || null;
    },

    /**
     * 位置に基づいてチームIDを取得
     */
    getTeamForPosition(position: 'left' | 'right'): 'teamA' | 'teamB' {
      return position === 'left' ? this.getLeftTeamId() : this.getRightTeamId();
    },

    /**
     * チームのスタイルクラスを取得（位置に関係なくチームの固有色）
     */
    getTeamStyleClasses(teamId: 'teamA' | 'teamB') {
      const config = this.getTeamConfig(teamId);
      return {
        textColor: config?.colorClass || '',
        bgColor: config?.bgClass || '',
        hoverBgColor: config?.hoverBgClass || '',
        borderColor: config?.borderClass || '',
        focusRing: config?.focusRingClass || '',
        activeBg: config?.activeBgClass || '',
        doOrDieInactive: config?.doOrDieInactiveClass || ''
      };
    },

    // ローカル表示反転関連のヘルパーメソッド

    /**
     * 表示反転をトグル
     */
    toggleDisplayFlip() {
      this.displayFlipped = !this.displayFlipped;
      localStorage.setItem(STORAGE_KEYS.displayFlippedPrefix + this.gameId, String(this.displayFlipped));
    },

    /**
     * 表示上の左側にいるチームのIDを取得（反転考慮）
     */
    getDisplayLeftTeamId(): 'teamA' | 'teamB' {
      return this.displayFlipped ? this.getRightTeamId() : this.getLeftTeamId();
    },

    /**
     * 表示上の右側にいるチームのIDを取得（反転考慮）
     */
    getDisplayRightTeamId(): 'teamA' | 'teamB' {
      return this.displayFlipped ? this.getLeftTeamId() : this.getRightTeamId();
    },

    /**
     * 表示上の左側にいるチームのデータを取得（反転考慮）
     */
    getDisplayLeftTeam() {
      const teamId = this.getDisplayLeftTeamId();
      return (this.gameState as any)[teamId];
    },

    /**
     * 表示上の右側にいるチームのデータを取得（反転考慮）
     */
    getDisplayRightTeam() {
      const teamId = this.getDisplayRightTeamId();
      return (this.gameState as any)[teamId];
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
      if (this.idleTimeoutId) {
        clearTimeout(this.idleTimeoutId);
        this.idleTimeoutId = null;
      }
      if (this.sendingAnimationTimeout) {
        clearTimeout(this.sendingAnimationTimeout);
        this.sendingAnimationTimeout = null;
      }
      if (this.receivingAnimationTimeout) {
        clearTimeout(this.receivingAnimationTimeout);
        this.receivingAnimationTimeout = null;
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

    // 共通モーダル表示
    openModal(type: string) {
      this.modalType = type;
      this.showQRModal = true;

      (this as any).$nextTick(() => {
        if (type === 'qr') {
          this.generateQRCode();
        }
        // Lucide iconsを再初期化
        if (typeof (window as any).lucide !== 'undefined') {
          (window as any).lucide.createIcons();
        }
      });
    },

    // QRモーダル表示（後方互換性のため）
    openQRModal() {
      this.openModal('qr');
    },

    // QRモーダル閉じる
    closeQRModal() {
      this.showQRModal = false;
      this.modalType = '';
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
    },

    // クレジットモーダル関連（後方互換性のため）
    openCreditsModal() {
      this.openModal('credits');
    },

    closeCreditsModal() {
      this.closeQRModal(); // 共通のclose関数を使用
    }
  };
}

// グローバルに公開
(window as any).gameApp = gameApp;
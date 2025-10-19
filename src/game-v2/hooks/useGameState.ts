import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import type { GameState, GameMessage, GameAction, MESSAGE_TYPES } from '../../types/game';
import { useWebSocket } from './useWebSocket';
import { useIdleTimer } from './useIdleTimer';
import { isValidScore, isValidDoOrDieCount, isValidTeamName } from '../../utils/score-logic';
import { gameStateLogger } from '../../utils/logger';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

interface UseGameStateOptions {
  gameId: string;
}

interface UseGameStateResult {
  gameState: GameState | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  errorMessage: string | null;
  sendingData: boolean;
  receivingData: boolean;
  serverTimeOffset: number;
  lastRTT: number;
  timeSyncStatus: 'good' | 'warning' | 'error' | 'unknown';
  lastSyncTime: Date | null;
  lastSyncClientTime: Date | null;
  lastSyncServerTime: Date | null;
  scoreUpdate: (team: 'teamA' | 'teamB', points: number) => void;
  resetTeamScore: (team: 'teamA' | 'teamB') => void;
  resetAllScores: () => void;
  doOrDieUpdate: (team: 'teamA' | 'teamB', delta: number) => void;
  doOrDieReset: () => void;
  setTeamName: (team: 'teamA' | 'teamB', name: string) => void;
  timerStart: () => void;
  timerPause: () => void;
  timerReset: () => void;
  timerSet: (minutes: number, seconds: number) => void;
  timerAdjust: (seconds: number) => void;
  subTimerStart: () => void;
  subTimerPause: () => void;
  subTimerReset: () => void;
  courtChange: () => void;
  resetAll: () => void;
  reconnect: () => void;
  requestTimeSync: () => void;
}

// 初期ゲーム状態
const createInitialGameState = (): GameState => ({
  teamA: {
    name: 'チームA',
    score: 0,
    doOrDieCount: 0,
  },
  teamB: {
    name: 'チームB',
    score: 0,
    doOrDieCount: 0,
  },
  timer: {
    totalDuration: 3600, // 60分
    startTime: null,
    isRunning: false,
    isPaused: false,
    pausedAt: null,
    remainingSeconds: 3600,
  },
  subTimer: {
    totalDuration: 30,
    startTime: null,
    isRunning: false,
    isPaused: false,
    pausedAt: null,
    remainingSeconds: 30,
  },
  leftSideTeam: 'teamA',
  serverTime: Date.now(),
  lastUpdated: Date.now(),
});

export function useGameState({ gameId }: UseGameStateOptions): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const sendActionRef = useRef<((action: GameAction) => boolean) | null>(null);
  const hasRequestedInitialState = useRef(false);

  // 時刻同期関連の状態
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [lastRTT, setLastRTT] = useState(0);
  const [timeSyncStatus, setTimeSyncStatus] = useState<'good' | 'warning' | 'error' | 'unknown'>('unknown');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastSyncClientTime, setLastSyncClientTime] = useState<Date | null>(null);
  const [lastSyncServerTime, setLastSyncServerTime] = useState<Date | null>(null);
  const lastSyncRequestRef = useRef(0);

  // アイドル同期のコールバック（Durable Objectsのハイバネーション防止）
  const handleIdleSync = useCallback(() => {
    gameStateLogger.debug('[IdleTimer] Sending GET_GAME_STATE due to idle timeout');
    if (sendActionRef.current) {
      lastSyncRequestRef.current = Date.now();
      sendActionRef.current({ type: 'GET_GAME_STATE' });
    }
  }, []);

  // アイドルタイマーフック
  const { resetIdleTimer } = useIdleTimer({
    isTimerRunning: gameState?.timer?.isRunning ?? false,
    isSubTimerRunning: gameState?.subTimer?.isRunning ?? false,
    onIdleSync: handleIdleSync,
  });

  const handleMessage = useCallback((message: GameMessage) => {
    gameStateLogger.debug('Received WebSocket message:', message.type);
    if (message.type === 'game_state' && message.data) {
      const data = message.data as GameState;
      const clientTime = Date.now();  // RTT計算用
      const performanceTime = performance.now();  // タイマー用

      // カウントダウン中は時刻同期を無視（タイマー情報を保持）
      setGameState(prevState => {
        const adjustedData: GameState = {
          ...data,
          timer: data.timer
            ? (data.timer.isRunning && prevState?.timer?.isRunning
                ? prevState.timer  // 実行中→前回のタイマー情報をそのまま保持
                : (data.timer.isRunning && data.timer.startTime
                    ? { ...data.timer, startTime: performanceTime }  // 新規開始→startTimeをperformance.now()に変換
                    : data.timer))  // 停止中→そのまま
            : data.timer,
          subTimer: data.subTimer
            ? (data.subTimer.isRunning && prevState?.subTimer?.isRunning
                ? prevState.subTimer  // 実行中→前回のタイマー情報をそのまま保持
                : (data.subTimer.isRunning && data.subTimer.startTime
                    ? { ...data.subTimer, startTime: performanceTime }  // 新規開始→startTimeをperformance.now()に変換
                    : data.subTimer))  // 停止中→そのまま
            : data.subTimer,
        };
        return adjustedData;
      });

      // 時刻同期計算（GET_GAME_STATEレスポンスで実行）
      if (lastSyncRequestRef.current > 0) {
        const clientTime = Date.now();

        // RTT計算（リクエスト送信から応答受信まで）
        const rtt = clientTime - lastSyncRequestRef.current;
        setLastRTT(Math.max(0, rtt));

        // サーバー時刻オフセット計算（片道遅延で補正）
        if (data.serverTime) {
          const halfRtt = rtt / 2;
          const estimatedServerReceiveTime = clientTime - halfRtt;
          const offset = data.serverTime - estimatedServerReceiveTime;
          setServerTimeOffset(offset);

          // 同期時の実際のクライアント・サーバー時刻を保存
          setLastSyncClientTime(new Date(lastSyncRequestRef.current));
          setLastSyncServerTime(new Date(data.serverTime));
        }

        // 同期時刻を更新
        setLastSyncTime(new Date());

        // 同期状態を更新
        const absOffset = Math.abs(serverTimeOffset);
        const currentRTT = Math.max(0, rtt);

        if (currentRTT > 1000 || absOffset > 3000) {
          setTimeSyncStatus('error');
        } else if (currentRTT > 500 || absOffset > 1000) {
          setTimeSyncStatus('warning');
        } else {
          setTimeSyncStatus('good');
        }

        // 同期リクエスト時刻をリセット
        lastSyncRequestRef.current = 0;
      }
    }

    // メッセージ受信時にアイドルタイマーをリセット
    resetIdleTimer();
  }, [resetIdleTimer, serverTimeOffset]);

  // アクション送信 + 時刻記録 + アイドルタイマーリセット
  const sendActionWithIdleReset = useCallback((action: GameAction) => {
    if (!sendActionRef.current) return false;

    // GET_GAME_STATE送信時に時刻を記録
    if (action.type === 'GET_GAME_STATE') {
      lastSyncRequestRef.current = Date.now();
    }

    const result = sendActionRef.current(action);

    // アクション送信成功時にアイドルタイマーをリセット
    if (result) {
      resetIdleTimer();
    }

    return result;
  }, [resetIdleTimer]);

  const handleConnected = useCallback(() => {
    gameStateLogger.info('Game WebSocket connected');
    // 初回接続時のみ状態を要求（重複リクエストを防ぐ）
    if (sendActionRef.current && !hasRequestedInitialState.current) {
      hasRequestedInitialState.current = true;
      sendActionWithIdleReset({ type: 'GET_GAME_STATE' });
    }

    // 接続成功時にアイドルタイマーを開始
    resetIdleTimer();
  }, [sendActionWithIdleReset, resetIdleTimer]);

  const handleDisconnected = useCallback(() => {
    gameStateLogger.info('Game WebSocket disconnected');
    // 再接続時に状態要求できるようにリセット
    hasRequestedInitialState.current = false;
  }, []);

  const handleError = useCallback((error: Event) => {
    gameStateLogger.error('Game WebSocket error:', error);
  }, []);

  const {
    sendAction,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,
    errorMessage,
    sendingData,
    receivingData,
    reconnect
  } = useWebSocket({
    gameId,
    onMessage: handleMessage,
    onConnected: handleConnected,
    onDisconnected: handleDisconnected,
    onError: handleError,
  });

  // sendActionを最新に保つ
  sendActionRef.current = sendAction;

  // gameIdが変わったときに状態要求フラグと時刻同期状態をリセット
  useEffect(() => {
    hasRequestedInitialState.current = false;
    setGameState(null); // 新しいゲームの状態をクリア
    // 時刻同期状態をリセット
    setServerTimeOffset(0);
    setLastRTT(0);
    setTimeSyncStatus('unknown');
    setLastSyncTime(null);
    setLastSyncClientTime(null);
    setLastSyncServerTime(null);
    lastSyncRequestRef.current = 0;
  }, [gameId]);

  const scoreUpdate = useCallback((team: 'teamA' | 'teamB', points: number) => {
    // クライアント側でスコアの妥当性を検証
    if (!gameState) return;

    const currentScore = team === 'teamA' ? gameState.teamA.score : gameState.teamB.score;
    const newScore = currentScore + points;

    // 新しいスコアが有効範囲（0-999）かチェック
    if (!isValidScore(newScore)) {
      gameStateLogger.warn(`Invalid score: ${newScore}. Score must be between 0 and 999.`);
      return;
    }

    sendActionWithIdleReset({
      type: 'SCORE_UPDATE',
      team,
      points,
    });
  }, [sendActionWithIdleReset, gameState]);

  const resetTeamScore = useCallback((team: 'teamA' | 'teamB') => {
    sendActionWithIdleReset({
      type: 'RESET_TEAM_SCORE',
      team,
    });
  }, [sendActionWithIdleReset]);

  const resetAllScores = useCallback(() => {
    sendActionWithIdleReset({
      type: 'RESET_SCORES',
    });
  }, [sendActionWithIdleReset]);

  const requestTimeSync = useCallback(() => {
    sendActionWithIdleReset({
      type: 'GET_GAME_STATE',
    });
  }, [sendActionWithIdleReset]);

  const doOrDieUpdate = useCallback((team: 'teamA' | 'teamB', delta: number) => {
    // クライアント側でDoOrDieカウントの妥当性を検証
    if (!gameState) return;

    const currentCount = team === 'teamA' ? gameState.teamA.doOrDieCount : gameState.teamB.doOrDieCount;
    const newCount = currentCount + delta;

    // 新しいカウントが有効範囲（0-3）かチェック
    if (!isValidDoOrDieCount(newCount)) {
      gameStateLogger.warn(`Invalid DoOrDie count: ${newCount}. Count must be between 0 and 3.`);
      return;
    }

    sendActionWithIdleReset({
      type: 'DO_OR_DIE_UPDATE',
      team,
      delta,
    });
  }, [sendActionWithIdleReset, gameState]);

  const doOrDieReset = useCallback(() => {
    sendActionWithIdleReset({
      type: 'DO_OR_DIE_RESET',
    });
  }, [sendActionWithIdleReset]);

  const setTeamName = useCallback((team: 'teamA' | 'teamB', name: string) => {
    // チーム名の妥当性を検証
    if (!isValidTeamName(name)) {
      gameStateLogger.warn(`Invalid team name: "${name}". Name must be 1-20 characters and not empty.`);
      return;
    }

    sendActionWithIdleReset({
      type: 'SET_TEAM_NAME',
      team,
      name: name.trim(),
    });
  }, [sendActionWithIdleReset]);

  const subTimerStart = useCallback(() => {
    sendActionWithIdleReset({
      type: 'SUB_TIMER_START',
    });
  }, [sendActionWithIdleReset]);

  const subTimerPause = useCallback(() => {
    sendActionWithIdleReset({
      type: 'SUB_TIMER_PAUSE',
    });
  }, [sendActionWithIdleReset]);

  const subTimerReset = useCallback(() => {
    sendActionWithIdleReset({
      type: 'SUB_TIMER_RESET',
    });
  }, [sendActionWithIdleReset]);

  const timerStart = useCallback(() => {
    sendActionWithIdleReset({
      type: 'TIMER_START',
    });
  }, [sendActionWithIdleReset]);

  const timerPause = useCallback(() => {
    sendActionWithIdleReset({
      type: 'TIMER_PAUSE',
    });
  }, [sendActionWithIdleReset]);

  const timerReset = useCallback(() => {
    sendActionWithIdleReset({
      type: 'TIMER_RESET',
    });
  }, [sendActionWithIdleReset]);

  const timerSet = useCallback((minutes: number, seconds: number) => {
    const totalSeconds = minutes * 60 + seconds;
    sendActionWithIdleReset({
      type: 'TIMER_SET',
      duration: totalSeconds,
    });
  }, [sendActionWithIdleReset]);

  const timerAdjust = useCallback((seconds: number) => {
    sendActionWithIdleReset({
      type: 'TIMER_ADJUST',
      seconds,
    });
  }, [sendActionWithIdleReset]);

  const courtChange = useCallback(() => {
    sendActionWithIdleReset({
      type: 'COURT_CHANGE',
    });
  }, [sendActionWithIdleReset]);

  const resetAll = useCallback(() => {
    sendActionWithIdleReset({
      type: 'RESET_ALL',
    });
  }, [sendActionWithIdleReset]);

  return {
    gameState,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,
    errorMessage,
    sendingData,
    receivingData,
    serverTimeOffset,
    lastRTT,
    timeSyncStatus,
    lastSyncTime,
    lastSyncClientTime,
    lastSyncServerTime,
    scoreUpdate,
    resetTeamScore,
    resetAllScores,
    doOrDieUpdate,
    doOrDieReset,
    setTeamName,
    timerStart,
    timerPause,
    timerReset,
    timerSet,
    timerAdjust,
    subTimerStart,
    subTimerPause,
    subTimerReset,
    courtChange,
    resetAll,
    reconnect,
    requestTimeSync,
  };
}
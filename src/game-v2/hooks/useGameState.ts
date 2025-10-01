import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import type { GameState, GameMessage, MESSAGE_TYPES } from '../../types/game';
import { useWebSocket } from './useWebSocket';
import { isValidScore, isValidDoOrDieCount, isValidTeamName } from '../../utils/score-logic';

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
  const sendActionRef = useRef<((action: any) => boolean) | null>(null);
  const hasRequestedInitialState = useRef(false);

  // 時刻同期関連の状態
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [lastRTT, setLastRTT] = useState(0);
  const [timeSyncStatus, setTimeSyncStatus] = useState<'good' | 'warning' | 'error' | 'unknown'>('unknown');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastSyncClientTime, setLastSyncClientTime] = useState<Date | null>(null);
  const [lastSyncServerTime, setLastSyncServerTime] = useState<Date | null>(null);
  const lastSyncRequestRef = useRef(0);

  const handleMessage = useCallback((message: GameMessage) => {
    console.log('Received WebSocket message:', message.type);
    if (message.type === 'game_state' && message.data) {
      const data = message.data as GameState;
      const clientTime = Date.now();

      // V1と同じstartTime調整処理: サーバー時刻をクライアント時刻に置換
      // タイマーが実行中の場合、startTimeを「メッセージ受信時のクライアント時刻」に置き換え
      if (data.timer && data.timer.isRunning && data.timer.startTime) {
        console.log('Adjusting timer startTime for relative calculation:', {
          originalStartTime: data.timer.startTime,
          remainingSeconds: data.timer.remainingSeconds,
          clientTime: clientTime
        });
        data.timer.startTime = clientTime;
      }

      // サブタイマーも同様の処理
      if (data.subTimer && data.subTimer.isRunning && data.subTimer.startTime) {
        console.log('Adjusting subTimer startTime for relative calculation:', {
          originalStartTime: data.subTimer.startTime,
          remainingSeconds: data.subTimer.remainingSeconds,
          clientTime: clientTime
        });
        data.subTimer.startTime = clientTime;
      }

      setGameState(data);

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
  }, [serverTimeOffset]);

  // GET_GAME_STATE送信時に時刻を記録するヘルパー関数
  const sendActionWithTimeSync = useCallback((action: any) => {
    if (!sendActionRef.current) return false;

    // GET_GAME_STATE送信時に時刻を記録
    if (action.type === 'GET_GAME_STATE') {
      lastSyncRequestRef.current = Date.now();
    }

    return sendActionRef.current(action);
  }, []);

  const handleConnected = useCallback(() => {
    console.log('Game WebSocket connected');
    // 初回接続時のみ状態を要求（重複リクエストを防ぐ）
    if (sendActionRef.current && !hasRequestedInitialState.current) {
      hasRequestedInitialState.current = true;
      sendActionWithTimeSync({ type: 'GET_GAME_STATE' });
    }
  }, [sendActionWithTimeSync]);

  const handleDisconnected = useCallback(() => {
    console.log('Game WebSocket disconnected');
    // 再接続時に状態要求できるようにリセット
    hasRequestedInitialState.current = false;
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Game WebSocket error:', error);
  }, []);

  const {
    sendAction,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,
    errorMessage,
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
      console.warn(`Invalid score: ${newScore}. Score must be between 0 and 999.`);
      return;
    }

    sendAction({
      type: 'SCORE_UPDATE',
      team,
      points,
    });
  }, [sendAction, gameState]);

  const resetTeamScore = useCallback((team: 'teamA' | 'teamB') => {
    sendAction({
      type: 'RESET_TEAM_SCORE',
      team,
    });
  }, [sendAction]);

  const resetAllScores = useCallback(() => {
    sendAction({
      type: 'RESET_SCORES',
    });
  }, [sendAction]);

  const requestTimeSync = useCallback(() => {
    sendActionWithTimeSync({
      type: 'GET_GAME_STATE',
    });
  }, [sendActionWithTimeSync]);

  const doOrDieUpdate = useCallback((team: 'teamA' | 'teamB', delta: number) => {
    // クライアント側でDoOrDieカウントの妥当性を検証
    if (!gameState) return;

    const currentCount = team === 'teamA' ? gameState.teamA.doOrDieCount : gameState.teamB.doOrDieCount;
    const newCount = currentCount + delta;

    // 新しいカウントが有効範囲（0-3）かチェック
    if (!isValidDoOrDieCount(newCount)) {
      console.warn(`Invalid DoOrDie count: ${newCount}. Count must be between 0 and 3.`);
      return;
    }

    sendAction({
      type: 'DO_OR_DIE_UPDATE',
      team,
      delta,
    });
  }, [sendAction, gameState]);

  const doOrDieReset = useCallback(() => {
    sendAction({
      type: 'DO_OR_DIE_RESET',
    });
  }, [sendAction]);

  const setTeamName = useCallback((team: 'teamA' | 'teamB', name: string) => {
    // チーム名の妥当性を検証
    if (!isValidTeamName(name)) {
      console.warn(`Invalid team name: "${name}". Name must be 1-20 characters and not empty.`);
      return;
    }

    sendAction({
      type: 'SET_TEAM_NAME',
      team,
      name: name.trim(),
    });
  }, [sendAction]);

  const subTimerStart = useCallback(() => {
    sendAction({
      type: 'SUB_TIMER_START',
    });
  }, [sendAction]);

  const subTimerPause = useCallback(() => {
    sendAction({
      type: 'SUB_TIMER_PAUSE',
    });
  }, [sendAction]);

  const subTimerReset = useCallback(() => {
    sendAction({
      type: 'SUB_TIMER_RESET',
    });
  }, [sendAction]);

  const timerStart = useCallback(() => {
    sendAction({
      type: 'TIMER_START',
    });
  }, [sendAction]);

  const timerPause = useCallback(() => {
    sendAction({
      type: 'TIMER_PAUSE',
    });
  }, [sendAction]);

  const timerReset = useCallback(() => {
    sendAction({
      type: 'TIMER_RESET',
    });
  }, [sendAction]);

  const timerSet = useCallback((minutes: number, seconds: number) => {
    const totalSeconds = minutes * 60 + seconds;
    sendAction({
      type: 'TIMER_SET',
      duration: totalSeconds,
    });
  }, [sendAction]);

  const timerAdjust = useCallback((seconds: number) => {
    sendAction({
      type: 'TIMER_ADJUST',
      seconds,
    });
  }, [sendAction]);

  return {
    gameState,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,
    errorMessage,
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
    reconnect,
    requestTimeSync,
  };
}
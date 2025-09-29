import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import type { GameState, GameMessage, MESSAGE_TYPES } from '../../types/game';
import { useWebSocket } from './useWebSocket';

interface UseGameStateOptions {
  gameId: string;
}

interface UseGameStateResult {
  gameState: GameState | null;
  isConnected: boolean;
  scoreUpdate: (team: 'teamA' | 'teamB', points: number) => void;
  resetTeamScore: (team: 'teamA' | 'teamB') => void;
  resetAllScores: () => void;
  reconnect: () => void;
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

  const handleMessage = useCallback((message: GameMessage) => {
    console.log('Received WebSocket message:', message.type);
    if (message.type === 'game_state' && message.data) {
      setGameState(message.data as GameState);
    }
  }, []);

  const handleConnected = useCallback(() => {
    console.log('Game WebSocket connected');
    // 初回接続時のみ状態を要求（重複リクエストを防ぐ）
    if (sendActionRef.current && !hasRequestedInitialState.current) {
      hasRequestedInitialState.current = true;
      sendActionRef.current({ type: 'GET_GAME_STATE' });
    }
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('Game WebSocket disconnected');
    // 再接続時に状態要求できるようにリセット
    hasRequestedInitialState.current = false;
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('Game WebSocket error:', error);
  }, []);

  const { sendAction, isConnected, reconnect } = useWebSocket({
    gameId,
    onMessage: handleMessage,
    onConnected: handleConnected,
    onDisconnected: handleDisconnected,
    onError: handleError,
  });

  // sendActionを最新に保つ
  sendActionRef.current = sendAction;

  // gameIdが変わったときに状態要求フラグをリセット
  useEffect(() => {
    hasRequestedInitialState.current = false;
    setGameState(null); // 新しいゲームの状態をクリア
  }, [gameId]);

  const scoreUpdate = useCallback((team: 'teamA' | 'teamB', points: number) => {
    sendAction({
      type: 'SCORE_UPDATE',
      team,
      points,
    });
  }, [sendAction]);

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

  return {
    gameState,
    isConnected,
    scoreUpdate,
    resetTeamScore,
    resetAllScores,
    reconnect,
  };
}
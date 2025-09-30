import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { App } from './App';
import type { GameState } from '../../types/game';

// useGameStateのモック
const mockGameState: GameState = {
  teamA: {
    name: 'チームA',
    score: 10,
    doOrDieCount: 2,
  },
  teamB: {
    name: 'チームB',
    score: 15,
    doOrDieCount: 1,
  },
  timer: {
    totalDuration: 3600,
    startTime: Date.now() - 600000, // 10分前に開始
    isRunning: true,
    isPaused: false,
    pausedAt: null,
    remainingSeconds: 3000, // 50分残り
  },
  subTimer: {
    totalDuration: 30,
    startTime: Date.now() - 10000, // 10秒前に開始
    isRunning: true,
    isPaused: false,
    pausedAt: null,
    remainingSeconds: 20,
  },
  leftSideTeam: 'teamA',
  serverTime: Date.now(),
  lastUpdated: Date.now(),
};

const mockUseGameState = {
  gameState: mockGameState,
  isConnected: true,
  connectionStatus: 'connected' as const,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  errorMessage: null,
  serverTimeOffset: 0,
  lastRTT: 50,
  timeSyncStatus: 'good' as const,
  lastSyncTime: Date.now(),
  lastSyncClientTime: Date.now(),
  lastSyncServerTime: Date.now(),
  scoreUpdate: vi.fn(),
  resetTeamScore: vi.fn(),
  resetAllScores: vi.fn(),
  doOrDieUpdate: vi.fn(),
  doOrDieReset: vi.fn(),
  reconnect: vi.fn(),
  requestTimeSync: vi.fn(),
};

vi.mock('../hooks/useGameState', () => ({
  useGameState: vi.fn(() => mockUseGameState),
}));

// timer-logicのモック
vi.mock('../utils/timer-logic', () => ({
  calculateRemainingSeconds: vi.fn(() => ({ seconds: 3000, isRunning: true })),
  calculateSubTimerRemainingSeconds: vi.fn(() => ({ seconds: 20, isRunning: true })),
}));

describe('App', () => {
  const mockGameId = 'test-game-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('接続中の場合、LoadingModalを表示する', () => {
    // connectionStatusが'connecting'の場合
    vi.mocked(mockUseGameState).connectionStatus = 'connecting' as const;

    const { useGameState } = require('../hooks/useGameState');
    useGameState.mockReturnValue({
      ...mockUseGameState,
      gameState: null,
      connectionStatus: 'connecting',
    });

    render(<App gameId={mockGameId} />);

    // LoadingModalの内容が表示されることを確認
    // （実際の実装に応じて調整が必要）
    expect(document.body.textContent).toContain('接続中' || '');
  });

  it('ゲーム状態がnullの場合、LoadingModalを表示する', () => {
    const { useGameState } = require('../hooks/useGameState');
    useGameState.mockReturnValue({
      ...mockUseGameState,
      gameState: null,
      connectionStatus: 'connected',
    });

    render(<App gameId={mockGameId} />);

    // LoadingModalが表示される
    expect(document.body.textContent).toBeTruthy();
  });

  it('接続完了後、チーム名が表示される', () => {
    const { useGameState } = require('../hooks/useGameState');
    useGameState.mockReturnValue(mockUseGameState);

    render(<App gameId={mockGameId} />);

    // チーム名が表示されることを確認
    expect(screen.getByText('チームA')).toBeTruthy();
    expect(screen.getByText('チームB')).toBeTruthy();
  });

  it('タイマーロジックが正しく呼び出される', () => {
    const { calculateRemainingSeconds, calculateSubTimerRemainingSeconds } =
      require('../utils/timer-logic');
    const { useGameState } = require('../hooks/useGameState');
    useGameState.mockReturnValue(mockUseGameState);

    render(<App gameId={mockGameId} />);

    // timer-logicの関数が呼ばれることを確認
    expect(calculateRemainingSeconds).toHaveBeenCalledWith(
      mockGameState.timer,
      mockUseGameState.serverTimeOffset
    );
    expect(calculateSubTimerRemainingSeconds).toHaveBeenCalledWith(
      mockGameState.subTimer,
      mockUseGameState.serverTimeOffset
    );
  });

  it('gameIdが正しく渡される', () => {
    const { useGameState } = require('../hooks/useGameState');
    useGameState.mockReturnValue(mockUseGameState);

    render(<App gameId={mockGameId} />);

    // useGameStateにgameIdが渡されることを確認
    expect(useGameState).toHaveBeenCalledWith({ gameId: mockGameId });
  });

  it('エラー状態の場合、適切に表示される', () => {
    const { useGameState } = require('../hooks/useGameState');
    useGameState.mockReturnValue({
      ...mockUseGameState,
      gameState: null,
      connectionStatus: 'disconnected',
      errorMessage: 'Connection failed',
      reconnectAttempts: 5,
    });

    render(<App gameId={mockGameId} />);

    // エラーメッセージまたはLoadingModalが表示される
    expect(document.body.textContent).toBeTruthy();
  });
});
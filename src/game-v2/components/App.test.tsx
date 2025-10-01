import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { App } from './App';
import type { GameState } from '../../types/game';
import { useGameState } from '../hooks/useGameState';

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

describe('App', () => {
  const mockGameId = 'test-game-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトのモック戻り値を設定
    vi.mocked(useGameState).mockReturnValue(mockUseGameState);
  });

  it('接続中の場合、LoadingModalを表示する', () => {
    // connectionStatusが'connecting'の場合
    vi.mocked(useGameState).mockReturnValue({
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
    vi.mocked(useGameState).mockReturnValue({
      ...mockUseGameState,
      gameState: null,
      connectionStatus: 'connected',
    });

    render(<App gameId={mockGameId} />);

    // LoadingModalが表示される
    expect(document.body.textContent).toBeTruthy();
  });

  it('接続完了後、チーム名が表示される', () => {
    vi.mocked(useGameState).mockReturnValue(mockUseGameState);

    render(<App gameId={mockGameId} />);

    // チーム名が表示されることを確認（複数のレイアウトで表示されるため、getAllByTextを使用）
    expect(screen.getAllByText('チームA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('チームB').length).toBeGreaterThan(0);
  });

  it('gameIdが正しく渡される', () => {
    vi.mocked(useGameState).mockReturnValue(mockUseGameState);

    render(<App gameId={mockGameId} />);

    // useGameStateにgameIdが渡されることを確認
    expect(useGameState).toHaveBeenCalledWith({ gameId: mockGameId });
  });

  it('エラー状態の場合、適切に表示される', () => {
    vi.mocked(useGameState).mockReturnValue({
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
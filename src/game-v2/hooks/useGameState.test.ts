import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useGameState } from './useGameState';
import type { GameState, GameMessage } from '../../types/game';
import { createMockGameState, createGameMessage } from '../test/test-utils';
import { useWebSocket } from './useWebSocket';

// useWebSocketのモック
const mockSendAction = vi.fn();
const mockReconnect = vi.fn();

vi.mock('./useWebSocket', () => ({
  useWebSocket: vi.fn(),
}));

describe('useGameState', () => {
  const mockGameId = 'test-game-123';
  const mockGameState = createMockGameState();
  let mockOnMessage: (message: GameMessage) => void;
  let mockOnConnected: () => void;
  let mockOnDisconnected: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendAction.mockReturnValue(true);

    // useWebSocketのモックを設定
    (useWebSocket as any).mockImplementation(({ onMessage, onConnected, onDisconnected }: any) => {
      mockOnMessage = onMessage;
      mockOnConnected = onConnected;
      mockOnDisconnected = onDisconnected;
      return {
        sendAction: mockSendAction,
        isConnected: true,
        connectionStatus: 'connected' as const,
        reconnectAttempts: 0,
        maxReconnectAttempts: 10,
        errorMessage: null,
        reconnect: mockReconnect,
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    expect(result.current.gameState).toBe(null);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.reconnectAttempts).toBe(0);
    expect(result.current.maxReconnectAttempts).toBe(10);
    expect(result.current.errorMessage).toBe(null);
    expect(result.current.serverTimeOffset).toBe(0);
    expect(result.current.lastRTT).toBe(0);
    expect(result.current.timeSyncStatus).toBe('unknown');
    expect(result.current.lastSyncTime).toBe(null);
  });

  it('ゲーム状態メッセージを正しく処理する', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    const mockGameState = createMockGameState();
    const gameStateMessage = createGameMessage('game_state', mockGameState);

    act(() => {
      mockOnMessage(gameStateMessage);
    });

    expect(result.current.gameState).toEqual(mockGameState);
  });

  it('scoreUpdateが正しく動作する', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    // gameStateを設定するためにメッセージを送信
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: 'game_state',
          data: mockGameState,
        });
      }
    });

    act(() => {
      result.current.scoreUpdate('teamA', 5);
    });

    expect(mockSendAction).toHaveBeenCalledWith({
      type: 'SCORE_UPDATE',
      team: 'teamA',
      points: 5,
    });
  });

  it('resetTeamScoreが正しく動作する', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    act(() => {
      result.current.resetTeamScore('teamB');
    });

    expect(mockSendAction).toHaveBeenCalledWith({
      type: 'RESET_TEAM_SCORE',
      team: 'teamB',
    });
  });

  it('resetAllScoresが正しく動作する', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    act(() => {
      result.current.resetAllScores();
    });

    expect(mockSendAction).toHaveBeenCalledWith({
      type: 'RESET_SCORES',
    });
  });

  it('doOrDieUpdateが正しく動作する', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    // gameStateを設定するためにメッセージを送信
    act(() => {
      if (mockOnMessage) {
        mockOnMessage({
          type: 'game_state',
          data: mockGameState,
        });
      }
    });

    act(() => {
      result.current.doOrDieUpdate('teamA', 1);
    });

    expect(mockSendAction).toHaveBeenCalledWith({
      type: 'DO_OR_DIE_UPDATE',
      team: 'teamA',
      delta: 1,
    });
  });

  it('doOrDieResetが正しく動作する', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    act(() => {
      result.current.doOrDieReset();
    });

    expect(mockSendAction).toHaveBeenCalledWith({
      type: 'DO_OR_DIE_RESET',
    });
  });

  it('requestTimeSyncが正しく動作する', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    act(() => {
      result.current.requestTimeSync();
    });

    expect(mockSendAction).toHaveBeenCalledWith({
      type: 'GET_GAME_STATE',
    });
  });

  it('reconnectが正しく動作する', () => {
    const { result } = renderHook(() =>
      useGameState({ gameId: mockGameId })
    );

    act(() => {
      result.current.reconnect();
    });

    expect(mockReconnect).toHaveBeenCalled();
  });

  describe('時刻同期機能', () => {
    beforeEach(() => {
      // Date.nowをモック
      vi.spyOn(Date, 'now').mockReturnValue(1000000);
    });

    it('時刻同期計算が正しく行われる', () => {
      const { result } = renderHook(() =>
        useGameState({ gameId: mockGameId })
      );

      // 先にrequestTimeSyncを呼ぶ（同期リクエスト時刻を記録）
      act(() => {
        result.current.requestTimeSync();
      });

      // 時刻を進める（RTT = 100ms）
      vi.spyOn(Date, 'now').mockReturnValue(1000100);

      const mockGameState = createMockGameState();
      mockGameState.serverTime = 1000050; // サーバー時刻

      const gameStateMessage = createGameMessage('game_state', mockGameState);

      act(() => {
        mockOnMessage(gameStateMessage);
      });

      // RTT = 100ms
      expect(result.current.lastRTT).toBe(100);

      // サーバーオフセット計算:
      // estimatedServerReceiveTime = 1000100 - 50 = 1000050
      // offset = 1000050 - 1000050 = 0
      expect(result.current.serverTimeOffset).toBe(0);

      expect(result.current.timeSyncStatus).toBe('good');
    });

    it('RTTが高い場合にwarning状態になる', () => {
      const { result } = renderHook(() =>
        useGameState({ gameId: mockGameId })
      );

      act(() => {
        result.current.requestTimeSync();
      });

      // RTT = 600ms（警告レベル）
      vi.spyOn(Date, 'now').mockReturnValue(1000600);

      const mockGameState = createMockGameState();
      mockGameState.serverTime = 1000300;

      const gameStateMessage = createGameMessage('game_state', mockGameState);

      act(() => {
        mockOnMessage(gameStateMessage);
      });

      expect(result.current.lastRTT).toBe(600);
      expect(result.current.timeSyncStatus).toBe('warning');
    });

    it('RTTが非常に高い場合にerror状態になる', () => {
      const { result } = renderHook(() =>
        useGameState({ gameId: mockGameId })
      );

      act(() => {
        result.current.requestTimeSync();
      });

      // RTT = 1100ms（エラーレベル）
      vi.spyOn(Date, 'now').mockReturnValue(1001100);

      const mockGameState = createMockGameState();
      mockGameState.serverTime = 1000550;

      const gameStateMessage = createGameMessage('game_state', mockGameState);

      act(() => {
        mockOnMessage(gameStateMessage);
      });

      expect(result.current.lastRTT).toBe(1100);
      expect(result.current.timeSyncStatus).toBe('error');
    });
  });

  describe('gameId変更時の処理', () => {
    it('gameIdが変更されたときに状態がリセットされる', () => {
      const { result, rerender } = renderHook(
        ({ gameId }) => useGameState({ gameId }),
        { initialProps: { gameId: mockGameId } }
      );

      // 初期状態を設定
      const mockGameState = createMockGameState();
      const gameStateMessage = createGameMessage('game_state', mockGameState);

      act(() => {
        mockOnMessage(gameStateMessage);
      });

      expect(result.current.gameState).toEqual(mockGameState);

      // gameIdを変更
      rerender({ gameId: 'new-game-456' });

      // 状態がリセットされることを確認
      expect(result.current.gameState).toBe(null);
      expect(result.current.serverTimeOffset).toBe(0);
      expect(result.current.lastRTT).toBe(0);
      expect(result.current.timeSyncStatus).toBe('unknown');
      expect(result.current.lastSyncTime).toBe(null);
    });
  });

  describe('接続状態の処理', () => {
    it('接続時にGET_GAME_STATEが送信される', () => {
      renderHook(() => useGameState({ gameId: mockGameId }));

      act(() => {
        mockOnConnected();
      });

      expect(mockSendAction).toHaveBeenCalledWith({
        type: 'GET_GAME_STATE',
      });
    });

    it('切断時に状態要求フラグがリセットされる', () => {
      renderHook(() => useGameState({ gameId: mockGameId }));

      // 接続
      act(() => {
        mockOnConnected();
      });

      // 切断
      act(() => {
        mockOnDisconnected();
      });

      // 再接続時に再度GET_GAME_STATEが送信されることを確認
      act(() => {
        mockOnConnected();
      });

      expect(mockSendAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('データ不変性の保証', () => {
    beforeEach(() => {
      vi.spyOn(Date, 'now').mockReturnValue(2000000);
      vi.spyOn(performance, 'now').mockReturnValue(2000000);
    });

    it('受信したdataオブジェクトを直接変更しない（タイマー実行中）', () => {
      const { result } = renderHook(() =>
        useGameState({ gameId: mockGameId })
      );

      const originalData = createMockGameState();
      originalData.timer.isRunning = true;
      originalData.timer.startTime = 1500000;
      originalData.timer.remainingSeconds = 100;

      // オリジナルデータのコピーを保存
      const originalTimerStartTime = originalData.timer.startTime;

      const gameStateMessage = createGameMessage('game_state', originalData);

      act(() => {
        mockOnMessage(gameStateMessage);
      });

      // 受信したオリジナルデータが変更されていないことを確認
      expect(originalData.timer.startTime).toBe(originalTimerStartTime);

      // gameStateは新しいオブジェクトとして設定される
      expect(result.current.gameState).not.toBe(originalData);
      expect(result.current.gameState?.timer).not.toBe(originalData.timer);

      // startTimeはクライアント時刻に調整される
      expect(result.current.gameState?.timer.startTime).toBe(2000000);
    });

    it('受信したdataオブジェクトを直接変更しない（サブタイマー実行中）', () => {
      const { result } = renderHook(() =>
        useGameState({ gameId: mockGameId })
      );

      const originalData = createMockGameState();
      originalData.subTimer.isRunning = true;
      originalData.subTimer.startTime = 1500000;
      originalData.subTimer.remainingSeconds = 25;

      const originalSubTimerStartTime = originalData.subTimer.startTime;

      const gameStateMessage = createGameMessage('game_state', originalData);

      act(() => {
        mockOnMessage(gameStateMessage);
      });

      // 受信したオリジナルデータが変更されていないことを確認
      expect(originalData.subTimer.startTime).toBe(originalSubTimerStartTime);

      // gameStateは新しいオブジェクトとして設定される
      expect(result.current.gameState).not.toBe(originalData);
      expect(result.current.gameState?.subTimer).not.toBe(originalData.subTimer);

      // startTimeはクライアント時刻に調整される
      expect(result.current.gameState?.subTimer.startTime).toBe(2000000);
    });

    it('タイマーが停止中の場合、dataオブジェクトはそのまま使用される', () => {
      const { result } = renderHook(() =>
        useGameState({ gameId: mockGameId })
      );

      const originalData = createMockGameState();
      originalData.timer.isRunning = false;
      originalData.timer.startTime = null;

      const gameStateMessage = createGameMessage('game_state', originalData);

      act(() => {
        mockOnMessage(gameStateMessage);
      });

      // タイマー停止中なのでtimerオブジェクトは元のまま
      expect(result.current.gameState?.timer).toBe(originalData.timer);
    });

    it('両方のタイマーが実行中の場合、両方とも新しいオブジェクトになる', () => {
      const { result } = renderHook(() =>
        useGameState({ gameId: mockGameId })
      );

      const originalData = createMockGameState();
      originalData.timer.isRunning = true;
      originalData.timer.startTime = 1500000;
      originalData.subTimer.isRunning = true;
      originalData.subTimer.startTime = 1800000;

      const gameStateMessage = createGameMessage('game_state', originalData);

      act(() => {
        mockOnMessage(gameStateMessage);
      });

      // 両方のタイマーが新しいオブジェクトになる
      expect(result.current.gameState).not.toBe(originalData);
      expect(result.current.gameState?.timer).not.toBe(originalData.timer);
      expect(result.current.gameState?.subTimer).not.toBe(originalData.subTimer);

      // 両方のstartTimeがクライアント時刻に調整される
      expect(result.current.gameState?.timer.startTime).toBe(2000000);
      expect(result.current.gameState?.subTimer.startTime).toBe(2000000);
    });
  });
});
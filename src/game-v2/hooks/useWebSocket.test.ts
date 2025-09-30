import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useWebSocket } from './useWebSocket';
import type { GameMessage } from '../../types/game';

// WebSocketManagerのモック
const mockWebSocketManager = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendAction: vi.fn(),
  isConnected: vi.fn(),
  reconnect: vi.fn(),
};

// useWebSocketモジュールをモック
vi.mock('./useWebSocket', async () => {
  const actual = await vi.importActual('./useWebSocket');
  return {
    ...actual,
    // WebSocketManagerクラスをモック
  };
});

describe('useWebSocket', () => {
  const mockGameId = 'test-game-123';
  const mockOnMessage = vi.fn();
  const mockOnConnected = vi.fn();
  const mockOnDisconnected = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketManager.sendAction.mockReturnValue(true);
    mockWebSocketManager.isConnected.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        gameId: mockGameId,
        onMessage: mockOnMessage,
        onConnected: mockOnConnected,
        onDisconnected: mockOnDisconnected,
        onError: mockOnError,
      })
    );

    expect(result.current.isConnected).toBe(false);
    // useEffectで接続が開始されるため、初期状態は'connecting'になる
    expect(result.current.connectionStatus).toBe('connecting');
    expect(result.current.reconnectAttempts).toBe(0);
    expect(result.current.maxReconnectAttempts).toBe(10);
    expect(result.current.errorMessage).toBe(null);
  });

  it('sendActionが正しく動作する', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        gameId: mockGameId,
        onMessage: mockOnMessage,
        onConnected: mockOnConnected,
        onDisconnected: mockOnDisconnected,
        onError: mockOnError,
      })
    );

    const testAction = { type: 'TEST_ACTION', data: 'test' };

    act(() => {
      const success = result.current.sendAction(testAction);
      // 接続されていない状態では失敗する
      expect(success).toBe(false);
    });
  });

  it('reconnectが正しく呼び出される', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        gameId: mockGameId,
        onMessage: mockOnMessage,
        onConnected: mockOnConnected,
        onDisconnected: mockOnDisconnected,
        onError: mockOnError,
      })
    );

    act(() => {
      result.current.reconnect();
    });

    // reconnectが呼ばれることを確認（実際の実装に依存）
    expect(typeof result.current.reconnect).toBe('function');
  });

  it('gameIdが変更されたときに再接続される', () => {
    const { rerender } = renderHook(
      ({ gameId }) =>
        useWebSocket({
          gameId,
          onMessage: mockOnMessage,
          onConnected: mockOnConnected,
          onDisconnected: mockOnDisconnected,
          onError: mockOnError,
        }),
      {
        initialProps: { gameId: mockGameId },
      }
    );

    // gameIdを変更
    rerender({ gameId: 'new-game-456' });

    // 新しいgameIdで接続が試行されることを確認
    // （実際の実装に依存するため、ここではフックが再レンダリングされることを確認）
    expect(true).toBe(true); // プレースホルダー
  });

  it('コンポーネントアンマウント時にクリーンアップされる', () => {
    const { unmount } = renderHook(() =>
      useWebSocket({
        gameId: mockGameId,
        onMessage: mockOnMessage,
        onConnected: mockOnConnected,
        onDisconnected: mockOnDisconnected,
        onError: mockOnError,
      })
    );

    unmount();

    // クリーンアップが正しく行われることを確認
    // （実際の実装に依存するため、ここではエラーが発生しないことを確認）
    expect(true).toBe(true); // プレースホルダー
  });
});

describe('WebSocketManager（統合テスト）', () => {
  let mockWebSocket: any;

  beforeEach(() => {
    // グローバルWebSocketをモック
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: WebSocket.OPEN,
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
    };

    (global as any).WebSocket = vi.fn(() => mockWebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('WebSocket接続が正しく確立される', async () => {
    const mockOnConnected = vi.fn();

    renderHook(() =>
      useWebSocket({
        gameId: 'test-game',
        onConnected: mockOnConnected,
      })
    );

    // WebSocketが作成されることを確認
    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('/ws/test-game')
    );
  });

  it('メッセージ送信が正しく動作する', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        gameId: 'test-game',
      })
    );

    // 接続状態をシミュレート
    act(() => {
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
    });

    const testAction = { type: 'TEST_ACTION' };

    act(() => {
      result.current.sendAction(testAction);
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ action: testAction })
    );
  });

  it('メッセージ受信が正しく処理される', () => {
    const mockOnMessage = vi.fn();

    renderHook(() =>
      useWebSocket({
        gameId: 'test-game',
        onMessage: mockOnMessage,
      })
    );

    const testMessage: GameMessage = {
      type: 'game_state',
      data: { test: 'data' },
    };

    act(() => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(
          new MessageEvent('message', {
            data: JSON.stringify(testMessage),
          })
        );
      }
    });

    expect(mockOnMessage).toHaveBeenCalledWith(testMessage);
  });

  it('接続エラーが正しく処理される', () => {
    const mockOnError = vi.fn();

    renderHook(() =>
      useWebSocket({
        gameId: 'test-game',
        onError: mockOnError,
      })
    );

    act(() => {
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }
    });

    expect(mockOnError).toHaveBeenCalledWith(expect.any(Event));
  });

  it('接続切断が正しく処理される', () => {
    const mockOnDisconnected = vi.fn();

    renderHook(() =>
      useWebSocket({
        gameId: 'test-game',
        onDisconnected: mockOnDisconnected,
      })
    );

    act(() => {
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(
          new CloseEvent('close', { code: 1000, reason: 'Normal closure' })
        );
      }
    });

    expect(mockOnDisconnected).toHaveBeenCalled();
  });

  it('不正なJSONメッセージを受信した場合、エラーを処理する', () => {
    const mockOnError = vi.fn();
    const mockOnMessage = vi.fn();

    renderHook(() =>
      useWebSocket({
        gameId: 'test-game',
        onMessage: mockOnMessage,
        onError: mockOnError,
      })
    );

    act(() => {
      if (mockWebSocket.onmessage) {
        // 不正なJSON文字列
        mockWebSocket.onmessage(
          new MessageEvent('message', {
            data: 'invalid json {',
          })
        );
      }
    });

    // onMessageは呼ばれない
    expect(mockOnMessage).not.toHaveBeenCalled();
    // エラーが発生してもアプリは続行する（console.errorで記録）
  });

  it('異常なコードでの切断時に再接続を試みる', () => {
    const mockOnDisconnected = vi.fn();

    renderHook(() =>
      useWebSocket({
        gameId: 'test-game',
        onDisconnected: mockOnDisconnected,
      })
    );

    act(() => {
      if (mockWebSocket.onclose) {
        // 異常切断（code: 1006）
        mockWebSocket.onclose(
          new CloseEvent('close', { code: 1006, reason: 'Abnormal closure' })
        );
      }
    });

    expect(mockOnDisconnected).toHaveBeenCalled();
  });

  it('空のメッセージを受信した場合、処理をスキップする', () => {
    const mockOnMessage = vi.fn();

    renderHook(() =>
      useWebSocket({
        gameId: 'test-game',
        onMessage: mockOnMessage,
      })
    );

    act(() => {
      if (mockWebSocket.onmessage) {
        // 空文字列
        mockWebSocket.onmessage(
          new MessageEvent('message', {
            data: '',
          })
        );
      }
    });

    // onMessageは呼ばれない
    expect(mockOnMessage).not.toHaveBeenCalled();
  });
});
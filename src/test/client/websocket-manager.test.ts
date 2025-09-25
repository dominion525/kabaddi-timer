// WebSocketManagerのテストファイル
// フェーズ1: 基本機能テスト（インスタンス作成、接続、状態管理、クリーンアップ）

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  WebSocketAPIs,
  WebSocketConstants,
  WebSocketManager
} from '../../client/components/websocket-manager.types';

// テスト対象のファクトリー関数をインポート
// グローバル関数として定義されているため、windowオブジェクトから取得
declare global {
  interface Window {
    createWebSocketManager?: (
      apis: WebSocketAPIs,
      constants: WebSocketConstants
    ) => WebSocketManager;
  }
}

// テスト用のモック作成ヘルパー関数
function createMockWebSocket() {
  return {
    onopen: null as ((this: WebSocket, ev: Event) => any) | null,
    onmessage: null as ((this: WebSocket, ev: MessageEvent) => any) | null,
    onclose: null as ((this: WebSocket, ev: CloseEvent) => any) | null,
    onerror: null as ((this: WebSocket, ev: Event) => any) | null,
    send: vi.fn(),
    close: vi.fn(),
    readyState: WebSocket.CONNECTING,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED
  } as unknown as WebSocket;
}

function createMockAPIs(): WebSocketAPIs {
  return {
    websocket: {
      create: vi.fn(),
      close: vi.fn(),
      send: vi.fn(),
      getReadyState: vi.fn()
    },
    window: {
      location: {
        getProtocol: vi.fn(() => 'http:'),
        getHost: vi.fn(() => 'localhost:3000')
      }
    },
    console: {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    },
    timer: {
      now: vi.fn(() => Date.now()),
      setTimeout: vi.fn((fn: () => void, ms: number) => setTimeout(fn, ms)),
      clearTimeout: vi.fn((id: number) => clearTimeout(id)),
      setInterval: vi.fn((fn: () => void, ms: number) => setInterval(fn, ms)),
      clearInterval: vi.fn((id: number) => clearInterval(id))
    }
  };
}

function createMockConstants(): WebSocketConstants {
  return {
    MESSAGE_TYPES: {
      GAME_STATE: 'gameState',
      TIME_SYNC: 'timeSync',
      ERROR: 'error'
    },
    WEBSOCKET_STATES: {
      OPEN: WebSocket.OPEN
    },
    ACTIONS: {
      TIME_SYNC_REQUEST: 'timeSyncRequest'
    }
  };
}

describe('WebSocketManager - フェーズ1: 基本機能テスト', () => {
  let mockAPIs: WebSocketAPIs;
  let mockConstants: WebSocketConstants;
  let mockWebSocket: WebSocket;
  let createWebSocketManager: (apis: WebSocketAPIs, constants: WebSocketConstants) => WebSocketManager;

  beforeEach(async () => {
    // モック初期化
    mockAPIs = createMockAPIs();
    mockConstants = createMockConstants();
    mockWebSocket = createMockWebSocket();

    // WebSocket作成時のモック設定
    vi.mocked(mockAPIs.websocket.create).mockReturnValue(mockWebSocket);
    vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.OPEN);

    // WebSocketManagerの動的インポート（グローバル関数として追加される）
    await import('../../client/components/websocket-manager');

    createWebSocketManager = window.createWebSocketManager!;
    expect(createWebSocketManager).toBeDefined();
  });

  afterEach(() => {
    // 各テスト後にモックをクリア
    vi.clearAllMocks();
  });

  describe('インスタンス作成', () => {
    it('WebSocketManagerインスタンスが正しく作成される', () => {
      // Act
      const manager = createWebSocketManager(mockAPIs, mockConstants);

      // Assert
      expect(manager).toBeDefined();
      expect(typeof manager.connect).toBe('function');
      expect(typeof manager.sendAction).toBe('function');
      expect(typeof manager.isConnected).toBe('function');
      expect(typeof manager.cleanup).toBe('function');
      expect(typeof manager.getDebugInfo).toBe('function');
      expect(typeof manager.reconnect).toBe('function');
      expect(typeof manager.getServerTimeOffset).toBe('function');
    });

    it('初期状態では未接続状態である', () => {
      // Act
      const manager = createWebSocketManager(mockAPIs, mockConstants);

      // Assert
      expect(manager.isConnected()).toBe(false);
      expect(manager.getServerTimeOffset()).toBe(0);

      const debugInfo = manager.getDebugInfo();
      expect(debugInfo.connected).toBe(false);
      expect(debugInfo.gameId).toBeNull();
      expect(debugInfo.serverTimeOffset).toBe(0);
      expect(debugInfo.wsReadyState).toBeNull();
      expect(debugInfo.hasTimeSyncInterval).toBe(false);
      expect(debugInfo.hasReconnectTimeout).toBe(false);
    });
  });

  describe('接続機能', () => {
    let manager: WebSocketManager;

    beforeEach(() => {
      manager = createWebSocketManager(mockAPIs, mockConstants);
    });

    it('connect()でWebSocket接続が確立される', () => {
      // Arrange
      const gameId = 'test-game-123';

      // Act
      manager.connect(gameId);

      // Assert
      expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(1);
      expect(mockAPIs.websocket.create).toHaveBeenCalledWith('ws://localhost:3000/ws/test-game-123');

      const debugInfo = manager.getDebugInfo();
      expect(debugInfo.gameId).toBe(gameId);
    });

    it('HTTPS環境ではwssプロトコルが使用される', () => {
      // Arrange
      vi.mocked(mockAPIs.window.location.getProtocol).mockReturnValue('https:');
      const gameId = 'test-game-456';

      // Act
      manager.connect(gameId);

      // Assert
      expect(mockAPIs.websocket.create).toHaveBeenCalledWith('wss://localhost:3000/ws/test-game-456');
    });

    it('既存の接続がある場合は古い接続をクローズしてから新しい接続を確立する', () => {
      // Arrange
      const gameId1 = 'game-1';
      const gameId2 = 'game-2';
      const firstWebSocket = createMockWebSocket();
      const secondWebSocket = createMockWebSocket();

      vi.mocked(mockAPIs.websocket.create)
        .mockReturnValueOnce(firstWebSocket)
        .mockReturnValueOnce(secondWebSocket);

      // Act
      manager.connect(gameId1);
      manager.connect(gameId2);

      // Assert
      expect(mockAPIs.websocket.close).toHaveBeenCalledWith(firstWebSocket);
      expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(2);
      expect(mockAPIs.websocket.create).toHaveBeenLastCalledWith('ws://localhost:3000/ws/game-2');
    });
  });

  describe('リソース管理', () => {
    let manager: WebSocketManager;

    beforeEach(() => {
      manager = createWebSocketManager(mockAPIs, mockConstants);
    });

    it('cleanup()でリソースが適切に解放される', () => {
      // Arrange - まず接続を確立
      const gameId = 'test-game';
      manager.connect(gameId);

      // 定期間隔とタイムアウトIDを設定
      const intervalId = 123;
      const timeoutId = 456;
      vi.mocked(mockAPIs.timer.setInterval).mockReturnValue(intervalId);
      vi.mocked(mockAPIs.timer.setTimeout).mockReturnValue(timeoutId);

      // Act
      manager.cleanup();

      // Assert
      expect(mockAPIs.websocket.close).toHaveBeenCalledWith(mockWebSocket);

      const debugInfo = manager.getDebugInfo();
      expect(debugInfo.connected).toBe(false);
      expect(debugInfo.gameId).toBeNull();
      expect(debugInfo.serverTimeOffset).toBe(0);
      expect(debugInfo.wsReadyState).toBeNull();
    });

    it('cleanup()は複数回呼んでも安全である', () => {
      // Arrange
      manager.connect('test-game');

      // Act
      manager.cleanup();
      manager.cleanup(); // 2回目

      // Assert - 2回目のcleanupでエラーが発生しないこと
      expect(() => manager.cleanup()).not.toThrow();
    });
  });

  describe('接続状態管理', () => {
    let manager: WebSocketManager;

    beforeEach(() => {
      manager = createWebSocketManager(mockAPIs, mockConstants);
    });

    it('isConnected()は接続状態を正しく返す - 接続成功時', () => {
      // Arrange
      vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.OPEN);

      // 接続を確立してonopenイベントをシミュレート
      manager.connect('test-game');
      const onOpen = mockWebSocket.onopen;
      if (onOpen) {
        onOpen.call(mockWebSocket, new Event('open'));
      }

      // Act & Assert
      expect(manager.isConnected()).toBe(true);
    });

    it('isConnected()は接続状態を正しく返す - 未接続時', () => {
      // Arrange - WebSocketは作成されていない状態
      vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.CLOSED);

      // Act & Assert
      expect(manager.isConnected()).toBe(false);
    });

    it('isConnected()は接続状態を正しく返す - 接続中時', () => {
      // Arrange
      vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.CONNECTING);
      manager.connect('test-game');

      // Act & Assert
      expect(manager.isConnected()).toBe(false); // CONNECTING状態はfalseを返すべき
    });

    it('getDebugInfo()は正確な状態情報を返す', () => {
      // Arrange
      const gameId = 'debug-test';
      vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.OPEN);

      manager.connect(gameId);
      // 接続成功をシミュレート
      const onOpen = mockWebSocket.onopen;
      if (onOpen) {
        onOpen.call(mockWebSocket, new Event('open'));
      }

      // Act
      const debugInfo = manager.getDebugInfo();

      // Assert
      expect(debugInfo.gameId).toBe(gameId);
      expect(debugInfo.connected).toBe(true);
      expect(debugInfo.wsReadyState).toBe(WebSocket.OPEN);
      expect(debugInfo.serverTimeOffset).toBe(0); // 初期値
      expect(typeof debugInfo.hasTimeSyncInterval).toBe('boolean');
      expect(typeof debugInfo.hasReconnectTimeout).toBe('boolean');
    });
    });

  describe('メッセージ送信（sendAction）', () => {
    let manager: WebSocketManager;
    let mockCallback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      manager = createWebSocketManager(mockAPIs, mockConstants);
      mockCallback = vi.fn();
    });

    it('接続時にアクションメッセージが正常に送信される', () => {
      // Arrange
      vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.OPEN);
      const testAction = { type: 'TEST_ACTION', data: 'test-data' };

      manager.connect('test-game', { onActionSent: mockCallback });

      // 接続成功をシミュレート（sendAction実行のため）
      const onOpen = mockWebSocket.onopen;
      if (onOpen) {
        onOpen.call(mockWebSocket, new Event('open'));
      }

      // Act
      const result = manager.sendAction(testAction);

      // Assert
      expect(result).toBe(true);
      expect(mockAPIs.websocket.send).toHaveBeenCalledWith(
        mockWebSocket,
        JSON.stringify({ action: testAction })
      );
      expect(mockAPIs.console.log).toHaveBeenCalledWith('Sent action:', testAction);
      expect(mockCallback).toHaveBeenCalledWith(testAction);
    });

    it('未接続時はメッセージ送信がfalseを返す', () => {
      // Arrange
      vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.CLOSED);
      const testAction = { type: 'TEST_ACTION', data: 'test-data' };

      // Act
      const result = manager.sendAction(testAction);

      // Assert
      expect(result).toBe(false);
      expect(mockAPIs.websocket.send).not.toHaveBeenCalled();
      expect(mockAPIs.console.warn).toHaveBeenCalledWith(
        'WebSocket not connected, action not sent:',
        testAction
      );
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('送信エラー時はfalseを返してエラーコールバックを呼ぶ', () => {
      // Arrange
      const mockErrorCallback = vi.fn();
      const testAction = { type: 'TEST_ACTION', data: 'test-data' };
      const sendError = new Error('Send failed');

      vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.OPEN);
      vi.mocked(mockAPIs.websocket.send).mockImplementation(() => {
        throw sendError;
      });

      manager.connect('test-game', {
        onActionSent: mockCallback,
        onError: mockErrorCallback
      });

      // 接続成功をシミュレート
      const onOpen = mockWebSocket.onopen;
      if (onOpen) {
        onOpen.call(mockWebSocket, new Event('open'));
      }

      // Act
      const result = manager.sendAction(testAction);

      // Assert
      expect(result).toBe(false);
      expect(mockAPIs.console.error).toHaveBeenCalledWith('Failed to send action:', sendError);
      expect(mockErrorCallback).toHaveBeenCalledWith('Action send failed', sendError);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('CONNECTING状態では送信されない', () => {
      // Arrange
      vi.mocked(mockAPIs.websocket.getReadyState).mockReturnValue(WebSocket.CONNECTING);
      const testAction = { type: 'TEST_ACTION', data: 'test-data' };

      manager.connect('test-game', { onActionSent: mockCallback });

      // Act
      const result = manager.sendAction(testAction);

      // Assert
      expect(result).toBe(false);
      expect(mockAPIs.websocket.send).not.toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('メッセージ受信処理', () => {
    let manager: WebSocketManager;

    beforeEach(() => {
      manager = createWebSocketManager(mockAPIs, mockConstants);
    });

    it('GAME_STATEメッセージを受信してコールバックを呼ぶ', () => {
      // Arrange
      const mockGameStateCallback = vi.fn();
      const testGameState = {
        teamA: { name: 'Team A', score: 5, doOrDieCount: 1 },
        teamB: { name: 'Team B', score: 3, doOrDieCount: 0 }
      };

      manager.connect('test-game', { onGameStateReceived: mockGameStateCallback });

      // WebSocketメッセージをシミュレート
      const onMessage = mockWebSocket.onmessage;
      const messageEvent = {
        data: JSON.stringify({
          type: 'gameState',
          data: testGameState
        })
      } as MessageEvent;

      // Act
      if (onMessage) {
        onMessage.call(mockWebSocket, messageEvent);
      }

      // Assert
      expect(mockAPIs.console.log).toHaveBeenCalledWith('Received game state:', testGameState);
      expect(mockGameStateCallback).toHaveBeenCalledWith(testGameState);
    });

    it('TIME_SYNCメッセージを受信して時刻同期を実行', () => {
      // Arrange
      const mockTimeSyncCallback = vi.fn();
      const mockNow = 1000000000; // 現在時刻（クライアント）
      const serverTime = 1000000100; // サーバー時刻
      const clientRequestTime = 999999950; // リクエスト送信時刻

      vi.mocked(mockAPIs.timer.now).mockReturnValue(mockNow);

      manager.connect('test-game', { onTimeSyncReceived: mockTimeSyncCallback });

      // TIME_SYNCメッセージをシミュレート
      const onMessage = mockWebSocket.onmessage;
      const messageEvent = {
        data: JSON.stringify({
          type: 'timeSync',
          data: {
            serverTime: serverTime,
            clientRequestTime: clientRequestTime
          }
        })
      } as MessageEvent;

      // Act
      if (onMessage) {
        onMessage.call(mockWebSocket, messageEvent);
      }

      // Assert
      const expectedRtt = mockNow - clientRequestTime; // 50ms
      const expectedOffset = serverTime - mockNow + (expectedRtt / 2); // 125ms

      expect(mockTimeSyncCallback).toHaveBeenCalledWith({
        offset: expectedOffset,
        rtt: expectedRtt,
        serverTime: serverTime,
        clientTime: mockNow
      });
      expect(mockAPIs.console.log).toHaveBeenCalledWith(
        'Time sync: offset =', expectedOffset, 'ms, RTT =', expectedRtt, 'ms'
      );

      // サーバータイムオフセットが更新されていることを確認
      expect(manager.getServerTimeOffset()).toBe(expectedOffset);
    });

    it('ERRORメッセージを受信してエラーコールバックを呼ぶ', () => {
      // Arrange
      const mockErrorCallback = vi.fn();
      const errorData = { message: 'Server error occurred', code: 500 };

      manager.connect('test-game', { onError: mockErrorCallback });

      // ERRORメッセージをシミュレート
      const onMessage = mockWebSocket.onmessage;
      const messageEvent = {
        data: JSON.stringify({
          type: 'error',
          data: errorData
        })
      } as MessageEvent;

      // Act
      if (onMessage) {
        onMessage.call(mockWebSocket, messageEvent);
      }

      // Assert
      expect(mockAPIs.console.error).toHaveBeenCalledWith('Server error:', errorData);
      expect(mockErrorCallback).toHaveBeenCalledWith('Server error', errorData);
    });

    it('不正なJSONメッセージを受信した時のエラー処理', () => {
      // Arrange
      const mockErrorCallback = vi.fn();
      manager.connect('test-game', { onError: mockErrorCallback });

      // 不正なJSONメッセージをシミュレート
      const onMessage = mockWebSocket.onmessage;
      const messageEvent = {
        data: '{ invalid json }'
      } as MessageEvent;

      // Act
      if (onMessage) {
        onMessage.call(mockWebSocket, messageEvent);
      }

      // Assert
      expect(mockAPIs.console.error).toHaveBeenCalledWith(
        'WebSocket message parse error:',
        expect.any(SyntaxError)
      );
      expect(mockErrorCallback).toHaveBeenCalledWith(
        'Message parse error',
        expect.any(SyntaxError)
      );
    });

    it('未知のメッセージタイプを受信しても処理を続行', () => {
      // Arrange
      const unknownMessage = {
        type: 'UNKNOWN_TYPE',
        data: { some: 'data' }
      };

      manager.connect('test-game');

      // 未知のメッセージタイプをシミュレート
      const onMessage = mockWebSocket.onmessage;
      const messageEvent = {
        data: JSON.stringify(unknownMessage)
      } as MessageEvent;

      // Act & Assert - エラーが発生しないことを確認
      expect(() => {
        if (onMessage) {
          onMessage.call(mockWebSocket, messageEvent);
        }
      }).not.toThrow();

      // コンソールエラーは発生しない（未知のタイプは無視される）
      expect(mockAPIs.console.error).not.toHaveBeenCalled();
    });

    it('clientRequestTimeがない場合のRTT計算', () => {
      // Arrange
      const mockTimeSyncCallback = vi.fn();
      const mockNow = 1000000000;
      const serverTime = 1000000100;

      vi.mocked(mockAPIs.timer.now).mockReturnValue(mockNow);

      manager.connect('test-game', { onTimeSyncReceived: mockTimeSyncCallback });

      // clientRequestTimeなしのTIME_SYNCメッセージ
      const onMessage = mockWebSocket.onmessage;
      const messageEvent = {
        data: JSON.stringify({
          type: 'timeSync',
          data: {
            serverTime: serverTime
            // clientRequestTimeなし
          }
        })
      } as MessageEvent;

      // Act
      if (onMessage) {
        onMessage.call(mockWebSocket, messageEvent);
      }

      // Assert - RTTは0として計算されるべき
      const expectedOffset = serverTime - mockNow + (0 / 2);

      expect(mockTimeSyncCallback).toHaveBeenCalledWith({
        offset: expectedOffset,
        rtt: 0,
        serverTime: serverTime,
        clientTime: mockNow
      });
    });
  });

  // ========================================
  // コールバック関数テスト
  // ========================================
  describe('Callback Function Tests', () => {
    let manager: WebSocketManager;
    let mockWebSocket: any;
    let mockAPIs: any;

    beforeEach(() => {
      mockWebSocket = createMockWebSocket();
      mockAPIs = createMockAPIs();
      mockAPIs.websocket.create.mockReturnValue(mockWebSocket);
      manager = createWebSocketManager(mockAPIs, mockConstants);
    });

    describe('onConnected callback', () => {
      test('接続成功時にonConnectedコールバックが呼ばれる', () => {
        // Arrange
        const mockOnConnected = vi.fn();

        // Act
        manager.connect('test-game-123', {
          onConnected: mockOnConnected
        });

        // WebSocket接続成功をシミュレート
        mockWebSocket.onopen();

        // Assert
        expect(mockOnConnected).toHaveBeenCalledTimes(1);
      });

      test('onConnectedコールバックが未定義でもエラーにならない', () => {
        // Arrange - onConnectedコールバックを指定しない

        // Act & Assert - エラーが発生しないことを確認
        expect(() => {
          manager.connect('test-game-123');
          mockWebSocket.onopen();
        }).not.toThrow();
      });
    });

    describe('onDisconnected callback', () => {
      test('切断時にonDisconnectedコールバックが呼ばれる', () => {
        // Arrange
        const mockOnDisconnected = vi.fn();
        manager.connect('test-game-123', {
          onDisconnected: mockOnDisconnected
        });
        mockWebSocket.onopen();

        // Act - WebSocket切断をシミュレート
        mockWebSocket.onclose();

        // Assert
        expect(mockOnDisconnected).toHaveBeenCalledTimes(1);
      });

      test('onDisconnectedコールバックが未定義でもエラーにならない', () => {
        // Arrange - onDisconnectedコールバックを指定しない
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // Act & Assert - エラーが発生しないことを確認
        expect(() => {
          mockWebSocket.onclose();
        }).not.toThrow();
      });
    });

    describe('onGameStateReceived callback', () => {
      test('GAME_STATEメッセージ受信時にonGameStateReceivedコールバックが呼ばれる', () => {
        // Arrange
        const mockOnGameStateReceived = vi.fn();
        const gameStateData = {
          teamA: { name: 'Team A', score: 10, doOrDieCount: 1 },
          teamB: { name: 'Team B', score: 8, doOrDieCount: 0 },
          timer: { remaining: 300000, isActive: true },
          subTimer: { remaining: 30000, isActive: false }
        };

        manager.connect('test-game-123', {
          onGameStateReceived: mockOnGameStateReceived
        });
        mockWebSocket.onopen();

        // Act - GAME_STATEメッセージを受信
        const message = {
          type: 'gameState',
          data: gameStateData
        };
        mockWebSocket.onmessage({ data: JSON.stringify(message) });

        // Assert
        expect(mockOnGameStateReceived).toHaveBeenCalledTimes(1);
        expect(mockOnGameStateReceived).toHaveBeenCalledWith(gameStateData);
      });

      test('onGameStateReceivedコールバックが未定義でもエラーにならない', () => {
        // Arrange - onGameStateReceivedコールバックを指定しない
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        const gameStateData = { timer: { remaining: 300000 } };
        const message = { type: 'gameState', data: gameStateData };

        // Act & Assert - エラーが発生しないことを確認
        expect(() => {
          mockWebSocket.onmessage({ data: JSON.stringify(message) });
        }).not.toThrow();
      });
    });

    describe('onTimeSyncReceived callback', () => {
      test('TIME_SYNCメッセージ受信時にonTimeSyncReceivedコールバックが呼ばれる', () => {
        // Arrange
        const mockOnTimeSyncReceived = vi.fn();
        const mockNow = 1000000;
        mockAPIs.timer.now.mockReturnValue(mockNow);

        manager.connect('test-game-123', {
          onTimeSyncReceived: mockOnTimeSyncReceived
        });
        mockWebSocket.onopen();

        // Act - TIME_SYNCメッセージを受信
        const serverTime = 1000100;
        const clientRequestTime = 999900;
        const message = {
          type: 'timeSync',
          data: { serverTime, clientRequestTime }
        };
        mockWebSocket.onmessage({ data: JSON.stringify(message) });

        // Assert
        const expectedRtt = mockNow - clientRequestTime;  // 100ms
        const expectedOffset = serverTime - mockNow + (expectedRtt / 2);  // 100 - 0 + 50 = 150

        expect(mockOnTimeSyncReceived).toHaveBeenCalledTimes(1);
        expect(mockOnTimeSyncReceived).toHaveBeenCalledWith({
          offset: expectedOffset,
          rtt: expectedRtt,
          serverTime: serverTime,
          clientTime: mockNow
        });
      });

      test('onTimeSyncReceivedコールバックが未定義でもエラーにならない', () => {
        // Arrange - onTimeSyncReceivedコールバックを指定しない
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        const message = {
          type: 'timeSync',
          data: { serverTime: 1000000 }
        };

        // Act & Assert - エラーが発生しないことを確認
        expect(() => {
          mockWebSocket.onmessage({ data: JSON.stringify(message) });
        }).not.toThrow();
      });
    });

    describe('onError callback', () => {
      test('WebSocketエラー時にonErrorコールバックが呼ばれる', () => {
        // Arrange
        const mockOnError = vi.fn();
        manager.connect('test-game-123', {
          onError: mockOnError
        });

        const errorEvent = new Event('error');

        // Act - WebSocketエラーをシミュレート
        mockWebSocket.onerror(errorEvent);

        // Assert
        expect(mockOnError).toHaveBeenCalledTimes(1);
        expect(mockOnError).toHaveBeenCalledWith('WebSocket error', errorEvent);
      });

      test('メッセージパースエラー時にonErrorコールバックが呼ばれる', () => {
        // Arrange
        const mockOnError = vi.fn();
        manager.connect('test-game-123', {
          onError: mockOnError
        });
        mockWebSocket.onopen();

        // Act - 無効なJSONメッセージを受信
        const invalidJSON = 'invalid json {';
        mockWebSocket.onmessage({ data: invalidJSON });

        // Assert
        expect(mockOnError).toHaveBeenCalledTimes(1);
        expect(mockOnError).toHaveBeenCalledWith('Message parse error', expect.any(SyntaxError));
      });

      test('サーバーエラーメッセージ受信時にonErrorコールバックが呼ばれる', () => {
        // Arrange
        const mockOnError = vi.fn();
        manager.connect('test-game-123', {
          onError: mockOnError
        });
        mockWebSocket.onopen();

        // Act - ERRORメッセージを受信
        const errorData = { message: 'Server internal error', code: 500 };
        const message = { type: 'error', data: errorData };
        mockWebSocket.onmessage({ data: JSON.stringify(message) });

        // Assert
        expect(mockOnError).toHaveBeenCalledTimes(1);
        expect(mockOnError).toHaveBeenCalledWith('Server error', errorData);
      });

      test('onErrorコールバックが未定義でもエラーにならない', () => {
        // Arrange - onErrorコールバックを指定しない
        manager.connect('test-game-123');

        // Act & Assert - エラーが発生しないことを確認
        expect(() => {
          mockWebSocket.onerror(new Event('error'));
        }).not.toThrow();
      });
    });

    describe('onActionSent callback', () => {
      test('アクション送信成功時にonActionSentコールバックが呼ばれる', () => {
        // Arrange
        const mockOnActionSent = vi.fn();
        manager.connect('test-game-123', {
          onActionSent: mockOnActionSent
        });
        mockWebSocket.onopen();
        mockWebSocket.readyState = WebSocket.OPEN;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.OPEN);

        const action = { type: 'START_TIMER' };

        // Act - アクションを送信
        const result = manager.sendAction(action);

        // Assert
        expect(result).toBe(true);
        expect(mockOnActionSent).toHaveBeenCalledTimes(1);
        expect(mockOnActionSent).toHaveBeenCalledWith(action);
      });

      test('アクション送信失敗時はonActionSentコールバックが呼ばれない', () => {
        // Arrange
        const mockOnActionSent = vi.fn();
        manager.connect('test-game-123', {
          onActionSent: mockOnActionSent
        });
        // 接続していない状態（readyState = CONNECTING）

        const action = { type: 'START_TIMER' };

        // Act - 未接続状態でアクションを送信
        const result = manager.sendAction(action);

        // Assert
        expect(result).toBe(false);
        expect(mockOnActionSent).not.toHaveBeenCalled();
      });

      test('onActionSentコールバックが未定義でもエラーにならない', () => {
        // Arrange - onActionSentコールバックを指定しない
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.readyState = WebSocket.OPEN;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.OPEN);

        const action = { type: 'START_TIMER' };

        // Act & Assert - エラーが発生しないことを確認
        expect(() => {
          manager.sendAction(action);
        }).not.toThrow();
      });
    });

    describe('複数コールバック同時指定', () => {
      test('複数のコールバックが同時に適切に動作する', () => {
        // Arrange
        const mockOnConnected = vi.fn();
        const mockOnGameStateReceived = vi.fn();
        const mockOnActionSent = vi.fn();

        manager.connect('test-game-123', {
          onConnected: mockOnConnected,
          onGameStateReceived: mockOnGameStateReceived,
          onActionSent: mockOnActionSent
        });

        // Act 1: 接続成功
        mockWebSocket.onopen();

        // Act 2: GAME_STATEメッセージ受信
        const gameStateData = { timer: { remaining: 300000 } };
        const message = { type: 'gameState', data: gameStateData };
        mockWebSocket.onmessage({ data: JSON.stringify(message) });

        // Act 3: アクション送信
        mockWebSocket.readyState = WebSocket.OPEN;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.OPEN);
        const action = { type: 'START_TIMER' };
        manager.sendAction(action);

        // Assert - 全てのコールバックが適切に呼ばれる
        expect(mockOnConnected).toHaveBeenCalledTimes(1);
        expect(mockOnGameStateReceived).toHaveBeenCalledTimes(1);
        expect(mockOnGameStateReceived).toHaveBeenCalledWith(gameStateData);
        expect(mockOnActionSent).toHaveBeenCalledTimes(1);
        expect(mockOnActionSent).toHaveBeenCalledWith(action);
      });
    });
  });

  // ========================================
  // Phase 4: 時刻同期インターバルテスト
  // ========================================
  describe('Time Sync Interval Tests', () => {
    let manager: WebSocketManager;
    let mockWebSocket: any;
    let mockAPIs: any;

    beforeEach(() => {
      // タイマーをモック化
      vi.useFakeTimers();

      mockWebSocket = createMockWebSocket();
      mockAPIs = createMockAPIs();
      mockAPIs.websocket.create.mockReturnValue(mockWebSocket);
      manager = createWebSocketManager(mockAPIs, mockConstants);
    });

    afterEach(() => {
      // テスト後のクリーンアップ
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    describe('インターバル開始・管理テスト', () => {
      test('接続時に時刻同期インターバルが自動的に開始される', () => {
        // Arrange - インターバル設定前はタイマーが0個
        expect(vi.getTimerCount()).toBe(0);

        // Act - WebSocket接続
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // Assert - インターバルが設定される（60秒インターバル1個 + 初回sendTimeSync用のタイマー）
        expect(vi.getTimerCount()).toBeGreaterThan(0);
        expect(mockAPIs.timer.setInterval).toHaveBeenCalledWith(
          expect.any(Function),
          60000 // 60秒
        );
      });

      test('既存のインターバルがある場合は先にクリアしてから新しいインターバルを設定', () => {
        // Arrange - 最初の接続でインターバルを設定
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        const initialSetIntervalCallCount = mockAPIs.timer.setInterval.mock.calls.length;
        const initialClearIntervalCallCount = mockAPIs.timer.clearInterval.mock.calls.length;

        // Act - 再接続（同じmanagerインスタンスで再度connect）
        manager.connect('test-game-456');

        // Assert - 既存インターバルがクリアされてから新しいインターバルが設定される
        expect(mockAPIs.timer.clearInterval).toHaveBeenCalledTimes(initialClearIntervalCallCount + 1);
        expect(mockAPIs.timer.setInterval).toHaveBeenCalledTimes(initialSetIntervalCallCount + 1);
      });
    });

    describe('インターバル実行テスト', () => {
      test('60秒ごとにsendTimeSyncが呼ばれる', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.readyState = WebSocket.OPEN;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.OPEN);

        // 初期状態でのsendAction呼び出し回数を記録（接続時の初回同期分）
        const initialSendActionCalls = mockAPIs.websocket.send.mock.calls.length;

        // Act - 60秒進める
        vi.advanceTimersByTime(60000);

        // Assert - 1回目の時刻同期が実行される
        expect(mockAPIs.websocket.send).toHaveBeenCalledTimes(initialSendActionCalls + 1);

        // 最新の呼び出しが時刻同期リクエストであることを確認
        const lastCall = mockAPIs.websocket.send.mock.calls[mockAPIs.websocket.send.mock.calls.length - 1];
        const sentMessage = JSON.parse(lastCall[1]);
        expect(sentMessage.action.type).toBe('timeSyncRequest');
      });

      test('複数回のインターバル実行で継続的に時刻同期が行われる', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.readyState = WebSocket.OPEN;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.OPEN);

        const initialSendActionCalls = mockAPIs.websocket.send.mock.calls.length;

        // Act - 3回のインターバル（180秒）
        vi.advanceTimersByTime(180000);

        // Assert - 3回の時刻同期が実行される
        expect(mockAPIs.websocket.send).toHaveBeenCalledTimes(initialSendActionCalls + 3);
      });

      test('未接続時はインターバルが動いてもsendTimeSyncが呼ばれない', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // WebSocketを切断状態にする
        mockWebSocket.readyState = WebSocket.CLOSED;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.CLOSED);

        const initialSendActionCalls = mockAPIs.websocket.send.mock.calls.length;

        // Act - 60秒進める（未接続状態）
        vi.advanceTimersByTime(60000);

        // Assert - 未接続なので時刻同期は実行されない
        expect(mockAPIs.websocket.send).toHaveBeenCalledTimes(initialSendActionCalls);
      });

      test('接続→切断→再接続のパターンでインターバルが正しく動作', () => {
        // Arrange - 初回接続
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.readyState = WebSocket.OPEN;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.OPEN);

        const initialSendActionCalls = mockAPIs.websocket.send.mock.calls.length;

        // Act 1 - 接続中に60秒進める
        vi.advanceTimersByTime(60000);
        expect(mockAPIs.websocket.send).toHaveBeenCalledTimes(initialSendActionCalls + 1);

        // Act 2 - 切断する
        mockWebSocket.readyState = WebSocket.CLOSED;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.CLOSED);

        // Act 3 - 切断中に60秒進める
        vi.advanceTimersByTime(60000);
        expect(mockAPIs.websocket.send).toHaveBeenCalledTimes(initialSendActionCalls + 1); // 増えない

        // Act 4 - 再接続
        mockWebSocket.readyState = WebSocket.OPEN;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.OPEN);

        // Act 5 - 再接続後に60秒進める
        vi.advanceTimersByTime(60000);

        // Assert - 再接続後は再び時刻同期が動作
        expect(mockAPIs.websocket.send).toHaveBeenCalledTimes(initialSendActionCalls + 2);
      });
    });

    describe('インターバルクリーンアップテスト', () => {
      test('cleanup実行時にインターバルがクリアされる', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // インターバルが設定されていることを確認
        expect(vi.getTimerCount()).toBeGreaterThan(0);

        // Act - クリーンアップ実行
        manager.cleanup();

        // Assert - インターバルがクリアされる
        expect(mockAPIs.timer.clearInterval).toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
      });

      test('クリーンアップ後はインターバルが動作しない', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.readyState = WebSocket.OPEN;
        mockAPIs.websocket.getReadyState.mockReturnValue(WebSocket.OPEN);

        const initialSendActionCalls = mockAPIs.websocket.send.mock.calls.length;

        // Act - クリーンアップしてから時間を進める
        manager.cleanup();
        vi.advanceTimersByTime(120000); // 2分進める

        // Assert - クリーンアップ後なのでインターバルは動作しない
        expect(mockAPIs.websocket.send).toHaveBeenCalledTimes(initialSendActionCalls);
      });

      test('複数回のcleanupでもエラーが発生しない', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // Act & Assert - 複数回cleanupしてもエラーが発生しない
        expect(() => {
          manager.cleanup();
          manager.cleanup();
          manager.cleanup();
        }).not.toThrow();
      });
    });

    describe('デバッグ情報での確認', () => {
      test('getDebugInfoでインターバルの状態が確認できる', () => {
        // Arrange - インターバル設定前
        let debugInfo = manager.getDebugInfo();
        expect(debugInfo.hasTimeSyncInterval).toBe(false);

        // Act - 接続してインターバル開始
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // Assert - インターバルが設定されている
        debugInfo = manager.getDebugInfo();
        expect(debugInfo.hasTimeSyncInterval).toBe(true);

        // Act - クリーンアップ
        manager.cleanup();

        // Assert - インターバルがクリアされている
        debugInfo = manager.getDebugInfo();
        expect(debugInfo.hasTimeSyncInterval).toBe(false);
      });
    });

    describe('エッジケーステスト', () => {
      test('connect前にcleanupを呼んでもエラーにならない', () => {
        // Act & Assert - 初期化前のクリーンアップでもエラーが発生しない
        expect(() => {
          manager.cleanup();
        }).not.toThrow();
      });

      test('高頻度での接続・切断でもインターバルが正しく管理される', () => {
        // Arrange & Act - 高頻度での接続・切断を繰り返す
        for (let i = 0; i < 5; i++) {
          manager.connect(`test-game-${i}`);
          mockWebSocket.onopen();
          manager.cleanup();
        }

        // Assert - 最終的にインターバルがクリアされている
        expect(vi.getTimerCount()).toBe(0);

        const debugInfo = manager.getDebugInfo();
        expect(debugInfo.hasTimeSyncInterval).toBe(false);
      });
    });
  });

  // ========================================
  // Phase 5: 再接続・リトライ機能テスト
  // ========================================
  describe('Reconnection and Retry Tests', () => {
    let manager: WebSocketManager;
    let mockWebSocket: any;
    let mockAPIs: any;

    beforeEach(() => {
      // タイマーをモック化
      vi.useFakeTimers();

      mockWebSocket = createMockWebSocket();
      mockAPIs = createMockAPIs();
      mockAPIs.websocket.create.mockReturnValue(mockWebSocket);
      manager = createWebSocketManager(mockAPIs, mockConstants);
    });

    afterEach(() => {
      // テスト後のクリーンアップ
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    describe('自動再接続テスト', () => {
      test('WebSocket切断時に3秒後の自動再接続タイマーが設定される', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // 切断前の状態確認
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(false);

        // Act - WebSocket切断をシミュレート
        mockWebSocket.onclose();

        // Assert - 再接続タイマーが設定される
        expect(mockAPIs.timer.setTimeout).toHaveBeenCalledWith(
          expect.any(Function),
          3000 // 3秒
        );
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(true);
      });

      test('3秒経過後に自動再接続が実行される', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;

        // Act - 切断してから3秒進める
        mockWebSocket.onclose();
        vi.advanceTimersByTime(3000);

        // Assert - 再接続のためのWebSocket作成が実行される
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 1);

        // 新しいWebSocketが同じURLで作成されることを確認
        const lastCall = mockAPIs.websocket.create.mock.calls[mockAPIs.websocket.create.mock.calls.length - 1];
        expect(lastCall[0]).toContain('test-game-123');
      });

      test('自動再接続時にonDisconnectedコールバックが呼ばれる', () => {
        // Arrange
        const mockOnDisconnected = vi.fn();
        manager.connect('test-game-123', {
          onDisconnected: mockOnDisconnected
        });
        mockWebSocket.onopen();

        // Act - WebSocket切断をシミュレート
        mockWebSocket.onclose();

        // Assert - onDisconnectedコールバックが呼ばれる
        expect(mockOnDisconnected).toHaveBeenCalledTimes(1);
      });

      test('gameIdがない場合は再接続されない', () => {
        // Arrange - gameIdをnullに設定
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // gameIdを内部的にnullにする（通常のクリーンアップでは発生しないが、テストケースとして）
        manager.cleanup();
        manager = createWebSocketManager(mockAPIs, mockConstants);

        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;

        // Act - 切断してから3秒進める（gameIdなしの状態）
        mockWebSocket.onclose();
        vi.advanceTimersByTime(3000);

        // Assert - 再接続は実行されない
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls);
      });
    });

    describe('再接続タイマー管理テスト', () => {
      test('複数回切断時は既存の再接続タイマーがクリアされてから新しいタイマーが設定される', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // Act - 1回目の切断
        mockWebSocket.onclose();
        const firstSetTimeoutCalls = mockAPIs.timer.setTimeout.mock.calls.length;

        // Act - 再度切断（まだ3秒経過前）
        mockWebSocket.onclose();

        // Assert - 既存タイマーがクリアされてから新しいタイマーが設定
        expect(mockAPIs.timer.clearTimeout).toHaveBeenCalled();
        expect(mockAPIs.timer.setTimeout).toHaveBeenCalledTimes(firstSetTimeoutCalls + 1);
      });

      test('再接続実行後はreconnectTimeoutIdがクリアされる', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // Act - 切断して3秒進めて再接続実行
        mockWebSocket.onclose();
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(true);

        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;
        vi.advanceTimersByTime(3000);

        // Assert - 再接続が実行されている
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 1);

        // Assert - 再接続実行後はタイマーIDがクリアされている
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(false);
      });
    });

    describe('手動再接続テスト', () => {
      test('reconnect()メソッドで即座に再接続が実行される', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;

        // Act - 手動再接続
        manager.reconnect();

        // Assert - 即座に再接続が実行される（タイマー待機なし）
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 1);

        // 同じgameIdで再接続されることを確認
        const lastCall = mockAPIs.websocket.create.mock.calls[mockAPIs.websocket.create.mock.calls.length - 1];
        expect(lastCall[0]).toContain('test-game-123');
      });

      test('reconnect()は既存の自動再接続タイマーをキャンセル', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.onclose();

        // 自動再接続タイマーが設定されている
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(true);
        const initialClearTimeoutCalls = mockAPIs.timer.clearTimeout.mock.calls.length;
        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;

        // Act - 手動再接続
        manager.reconnect();

        // Assert - 既存タイマーがキャンセルされる
        expect(mockAPIs.timer.clearTimeout).toHaveBeenCalledTimes(initialClearTimeoutCalls + 1);
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(false);

        // 手動再接続が実行される
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 1);

        // 3秒後に二重接続が起きないことを確認
        vi.advanceTimersByTime(3000);
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 1);
      });

      test('gameIdがない場合はreconnect()でも再接続されない', () => {
        // Arrange - 初期化のみでconnectしない
        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;

        // Act - gameIdがない状態で手動再接続
        manager.reconnect();

        // Assert - 再接続は実行されない
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls);
      });
    });

    describe('connect()の冪等性テスト', () => {
      test('connect()は既存の再接続タイマーをクリアしてから新規接続', () => {
        // Arrange - 初回接続→切断で自動再接続タイマー設定
        manager.connect('game-1');
        mockWebSocket.onopen();
        mockWebSocket.onclose();
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(true);

        const initialClearTimeoutCalls = mockAPIs.timer.clearTimeout.mock.calls.length;
        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;

        // Act - 別のゲームに接続（自動再接続待機中）
        manager.connect('game-2');

        // Assert - 既存タイマーがクリアされている
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(false);
        expect(mockAPIs.timer.clearTimeout).toHaveBeenCalledTimes(initialClearTimeoutCalls + 1);

        // 新しい接続が実行されている
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 1);
        expect(manager.getDebugInfo().gameId).toBe('game-2');

        // 3秒後に旧タイマーによる二重接続が起きない
        vi.advanceTimersByTime(3000);
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 1);
      });
    });

    describe('クリーンアップテスト', () => {
      test('cleanup実行時に再接続タイマーがクリアされる', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.onclose(); // 切断して再接続タイマーを設定

        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(true);

        // Act - クリーンアップ実行
        manager.cleanup();

        // Assert - 再接続タイマーがクリアされる
        expect(mockAPIs.timer.clearTimeout).toHaveBeenCalled();
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(false);
      });

      test('クリーンアップ後は自動再接続が動作しない', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.onclose(); // 切断して再接続タイマーを設定

        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;

        // Act - クリーンアップしてから3秒進める
        manager.cleanup();
        vi.advanceTimersByTime(5000); // 5秒進めても再接続しない

        // Assert - クリーンアップ後なので再接続は実行されない
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls);
      });
    });

    describe('複雑な再接続シナリオテスト', () => {
      test('接続→切断→自動再接続→再度切断→手動再接続の複合パターン', () => {
        // Arrange - 初回接続
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        const initialConnectCalls = mockAPIs.websocket.create.mock.calls.length;

        // Act 1 - 1回目の切断と自動再接続
        mockWebSocket.onclose();
        vi.advanceTimersByTime(3000);
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 1);

        // Act 2 - 2回目の切断（自動再接続待機中に手動再接続）
        mockWebSocket.onclose();
        expect(manager.getDebugInfo().hasReconnectTimeout).toBe(true);

        manager.reconnect(); // 手動再接続

        // Assert - 手動再接続が実行される
        expect(mockAPIs.websocket.create).toHaveBeenCalledTimes(initialConnectCalls + 2);
      });

      test('高頻度での切断・再接続でもタイマー管理が正しく動作', () => {
        // Arrange
        manager.connect('test-game-123');
        mockWebSocket.onopen();

        // Act - 高頻度での切断・手動再接続を繰り返す
        for (let i = 0; i < 10; i++) {
          mockWebSocket.onclose();
          manager.reconnect();
        }

        // Assert - デバッグ情報で状態が正しいことを確認
        const debugInfo = manager.getDebugInfo();
        expect(debugInfo.gameId).toBe('test-game-123');
        expect(debugInfo.hasReconnectTimeout).toBe(false);

        // 最終的にクリーンアップでもエラーが発生しない
        expect(() => {
          manager.cleanup();
        }).not.toThrow();
      });
    });

    describe('デバッグ情報での確認', () => {
      test('getDebugInfoで再接続タイマーの状態が正しく反映される', () => {
        // Arrange - 初期状態
        let debugInfo = manager.getDebugInfo();
        expect(debugInfo.hasReconnectTimeout).toBe(false);

        // Act - 接続・切断
        manager.connect('test-game-123');
        mockWebSocket.onopen();
        mockWebSocket.onclose();

        // Assert - 切断後は再接続タイマーが設定される
        debugInfo = manager.getDebugInfo();
        expect(debugInfo.hasReconnectTimeout).toBe(true);

        // Act - クリーンアップ
        manager.cleanup();

        // Assert - クリーンアップ後はタイマーがクリアされる
        debugInfo = manager.getDebugInfo();
        expect(debugInfo.hasReconnectTimeout).toBe(false);
      });
    });

    describe('エラーハンドリングテスト', () => {
      test('再接続時のエラー動作確認', () => {
        // Arrange
        const mockOnError = vi.fn();
        manager.connect('test-game-123', {
          onError: mockOnError
        });
        mockWebSocket.onopen();

        // 再接続時にWebSocket作成でエラーが発生することをシミュレート
        mockAPIs.websocket.create.mockImplementation(() => {
          throw new Error('Connection failed');
        });

        // Act - 切断して自動再接続を実行
        mockWebSocket.onclose();

        // Assert - 現在の実装では再接続時のエラーは外部に伝播する
        // これは改善の余地があるが、現在の動作として記録
        expect(() => {
          vi.advanceTimersByTime(3000);
        }).toThrow('Connection failed');
      });
    });
  });
});
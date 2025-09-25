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
      setTimeout: vi.fn(),
      clearTimeout: vi.fn(),
      setInterval: vi.fn(),
      clearInterval: vi.fn()
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
});
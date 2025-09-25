// WebSocketManager用の型定義
// WebSocket通信とタイマー同期機能に特化した型定義

import type { GameState } from '../../types/game';

/**
 * WebSocketManager依存注入API型定義
 * テスト時にモック可能なブラウザAPI・WebSocket APIの抽象化
 */
export interface WebSocketAPIs {
  // WebSocket関連API
  websocket: {
    create: (url: string) => WebSocket;
    close: (ws: WebSocket) => void;
    send: (ws: WebSocket, data: string) => void;
    getReadyState: (ws: WebSocket) => number;
  };

  // ブラウザ環境API
  window: {
    location: {
      getProtocol: () => string;
      getHost: () => string;
    };
  };

  // ログ出力API
  console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  };

  // タイマーAPI
  timer: {
    now: () => number;
    setTimeout: (fn: () => void, ms: number) => number;
    clearTimeout: (id: number) => void;
    setInterval: (fn: () => void, ms: number) => number;
    clearInterval: (id: number) => void;
  };
}

/**
 * WebSocketManager定数型定義
 * メッセージタイプと状態定数の型安全な定義
 */
export interface WebSocketConstants {
  MESSAGE_TYPES: {
    GAME_STATE: string;
    TIME_SYNC: string;
    ERROR: string;
  };

  WEBSOCKET_STATES: {
    OPEN: number;
  };

  ACTIONS: {
    TIME_SYNC_REQUEST: string;
  };
}

/**
 * WebSocketメッセージ型定義
 */
export interface WebSocketMessage {
  type: string;
  data?: any;
}

/**
 * 時刻同期データ型定義
 */
export interface TimeSyncData {
  serverTime: number;
  clientRequestTime?: number;
}

/**
 * 時刻同期結果型定義
 */
export interface TimeSyncResult {
  offset: number;
  rtt: number;
  serverTime: number;
  clientTime: number;
}

/**
 * アクションメッセージ型定義
 */
export interface ActionMessage {
  type: string;
  clientRequestTime?: number;
  [key: string]: any;
}

/**
 * WebSocketエラー型定義
 * WebSocketイベント、JavaScript Error、または不明な値
 */
export type WebSocketError = Error | Event | unknown;

/**
 * WebSocketManager初期化時のコールバック型定義
 */
export interface WebSocketCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onGameStateReceived?: (data: GameState) => void;
  onTimeSyncReceived?: (data: TimeSyncResult) => void;
  onError?: (type: string, error?: WebSocketError) => void;
  onActionSent?: (action: ActionMessage) => void;
}

/**
 * WebSocketManagerインスタンス型定義
 * 公開APIメソッドの型定義
 */
export interface WebSocketManager {
  connect: (id: string, callbackHandlers?: WebSocketCallbacks) => void;
  sendAction: (action: ActionMessage) => boolean;
  reconnect: () => void;
  cleanup: () => void;
  isConnected: () => boolean;
  getServerTimeOffset: () => number;
  getDebugInfo: () => {
    connected: boolean;
    gameId: string | null;
    serverTimeOffset: number;
    wsReadyState: number | null;
    hasTimeSyncInterval: boolean;
    hasReconnectTimeout: boolean;
  };
}

/**
 * WebSocketManagerファクトリー関数の型定義
 */
export type CreateWebSocketManagerFunction = (
  apis: WebSocketAPIs,
  constants: WebSocketConstants
) => WebSocketManager;
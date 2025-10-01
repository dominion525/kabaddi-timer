import { useEffect, useRef, useCallback, useState } from 'preact/hooks';
import type { GameAction, GameMessage, MESSAGE_TYPES } from '../../types/game';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  gameId: string;
  onMessage?: (message: GameMessage) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketResult {
  sendAction: (action: GameAction) => boolean;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  errorMessage: string | null;
  sendingData: boolean;
  receivingData: boolean;
  reconnect: () => void;
}

// グローバルWebSocket管理（シングルトンパターン）
class WebSocketManager {
  private connections: Map<string, {
    ws: WebSocket | null;
    isConnected: boolean;
    isConnecting: boolean;
    connectionStatus: ConnectionStatus;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    errorMessage: string | null;
    sendingData: boolean;
    receivingData: boolean;
    sendingAnimationTimeout: number | null;
    receivingAnimationTimeout: number | null;
    subscribers: Set<{
      onMessage?: (message: GameMessage) => void;
      onConnected?: () => void;
      onDisconnected?: () => void;
      onError?: (error: Event) => void;
      setIsConnected?: (connected: boolean) => void;
      setConnectionStatus?: (status: ConnectionStatus) => void;
      setReconnectAttempts?: (attempts: number) => void;
      setErrorMessage?: (message: string | null) => void;
      setSendingData?: (sending: boolean) => void;
      setReceivingData?: (receiving: boolean) => void;
    }>;
    reconnectTimeout: number | null;
    didUnmount: boolean;
  }> = new Map();

  connect(gameId: string, callbacks: {
    onMessage?: (message: GameMessage) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Event) => void;
    setIsConnected?: (connected: boolean) => void;
    setConnectionStatus?: (status: ConnectionStatus) => void;
    setReconnectAttempts?: (attempts: number) => void;
    setErrorMessage?: (message: string | null) => void;
    setSendingData?: (sending: boolean) => void;
    setReceivingData?: (receiving: boolean) => void;
  }) {
    console.log(`[WebSocketManager] Connect request for gameId: ${gameId}`);

    if (!gameId) {
      console.warn('[WebSocketManager] No gameId provided');
      return;
    }

    // 既存の接続がある場合はサブスクライバーに追加
    if (this.connections.has(gameId)) {
      const connection = this.connections.get(gameId)!;
      connection.subscribers.add(callbacks);
      console.log(`[WebSocketManager] Added subscriber to existing connection. Total subscribers: ${connection.subscribers.size}`);

      // 現在の状態を新しいサブスクライバーに通知
      callbacks.setIsConnected?.(connection.isConnected);
      callbacks.setConnectionStatus?.(connection.connectionStatus);
      callbacks.setReconnectAttempts?.(connection.reconnectAttempts);
      callbacks.setErrorMessage?.(connection.errorMessage);

      // 既に接続済みの場合は即座にonConnectedを呼ぶ
      if (connection.isConnected) {
        callbacks.onConnected?.();
      }
      return;
    }

    // 新しい接続を作成
    const connection = {
      ws: null,
      isConnected: false,
      isConnecting: false,
      connectionStatus: 'disconnected' as ConnectionStatus,
      reconnectAttempts: 0,
      maxReconnectAttempts: 10,
      errorMessage: null,
      sendingData: false,
      receivingData: false,
      sendingAnimationTimeout: null,
      receivingAnimationTimeout: null,
      subscribers: new Set([callbacks]),
      reconnectTimeout: null,
      didUnmount: false
    };

    this.connections.set(gameId, connection);
    this._createWebSocket(gameId);
  }

  disconnect(gameId: string, callbacks: any) {
    console.log(`[WebSocketManager] Disconnect request for gameId: ${gameId}`);

    const connection = this.connections.get(gameId);
    if (!connection) return;

    // サブスクライバーから削除
    connection.subscribers.delete(callbacks);
    console.log(`[WebSocketManager] Removed subscriber. Remaining: ${connection.subscribers.size}`);

    // サブスクライバーがいなくなったら接続を閉じる
    if (connection.subscribers.size === 0) {
      console.log(`[WebSocketManager] No more subscribers, closing connection for ${gameId}`);
      connection.didUnmount = true;
      this._closeConnection(gameId);
    }
  }

  sendAction(gameId: string, action: GameAction): boolean {
    const connection = this.connections.get(gameId);
    if (!connection?.ws || connection.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[WebSocketManager] Cannot send action, not connected: ${gameId}`);
      return false;
    }

    try {
      connection.ws.send(JSON.stringify({ action }));
      console.log(`[WebSocketManager] Sent action:`, action);

      // 送信アニメーションをトリガー
      this._triggerSendingAnimation(gameId);

      return true;
    } catch (error) {
      console.error(`[WebSocketManager] Failed to send action:`, error);
      return false;
    }
  }

  isConnected(gameId: string): boolean {
    return this.connections.get(gameId)?.isConnected || false;
  }

  reconnect(gameId: string) {
    console.log(`[WebSocketManager] Manual reconnect requested for ${gameId}`);
    const connection = this.connections.get(gameId);
    if (!connection) return;

    // 手動再接続時は試行回数をリセット
    connection.reconnectAttempts = 0;
    this._closeConnection(gameId, false);

    setTimeout(() => {
      if (this.connections.has(gameId) && !connection.didUnmount) {
        this._createWebSocket(gameId);
      }
    }, 1000);
  }

  /**
   * 送信アニメーション（フラッシュエフェクト）を開始
   */
  private _triggerSendingAnimation(gameId: string) {
    const connection = this.connections.get(gameId);
    if (!connection) return;

    // 既存のアニメーションタイマーをクリア
    if (connection.sendingAnimationTimeout) {
      clearTimeout(connection.sendingAnimationTimeout);
      connection.sendingAnimationTimeout = null;
    }

    // フラグを設定（300ms間）
    connection.sendingData = true;
    connection.subscribers.forEach(subscriber => {
      subscriber.setSendingData?.(true);
    });

    connection.sendingAnimationTimeout = window.setTimeout(() => {
      connection.sendingData = false;
      connection.sendingAnimationTimeout = null;
      connection.subscribers.forEach(subscriber => {
        subscriber.setSendingData?.(false);
      });
    }, 300);
  }

  /**
   * 受信アニメーション（フラッシュエフェクト）を開始
   */
  private _triggerReceivingAnimation(gameId: string) {
    const connection = this.connections.get(gameId);
    if (!connection) return;

    // 既存のアニメーションタイマーをクリア
    if (connection.receivingAnimationTimeout) {
      clearTimeout(connection.receivingAnimationTimeout);
      connection.receivingAnimationTimeout = null;
    }

    // フラグを設定（200ms間）
    connection.receivingData = true;
    connection.subscribers.forEach(subscriber => {
      subscriber.setReceivingData?.(true);
    });

    connection.receivingAnimationTimeout = window.setTimeout(() => {
      connection.receivingData = false;
      connection.receivingAnimationTimeout = null;
      connection.subscribers.forEach(subscriber => {
        subscriber.setReceivingData?.(false);
      });
    }, 200);
  }

  private _createWebSocket(gameId: string) {
    const connection = this.connections.get(gameId);
    if (!connection || connection.isConnecting || connection.didUnmount) {
      console.log(`[WebSocketManager] Skip create WebSocket: ${gameId} (${connection ? 'connecting/unmounted' : 'no connection'})`);
      return;
    }

    connection.isConnecting = true;
    connection.connectionStatus = connection.reconnectAttempts > 0 ? 'reconnecting' : 'connecting';
    connection.errorMessage = null;
    console.log(`[WebSocketManager] Creating WebSocket for ${gameId} (attempt ${connection.reconnectAttempts + 1})`);

    // 状態をサブスクライバーに通知
    connection.subscribers.forEach(subscriber => {
      subscriber.setConnectionStatus?.(connection.connectionStatus);
      subscriber.setReconnectAttempts?.(connection.reconnectAttempts);
      subscriber.setErrorMessage?.(connection.errorMessage);
    });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${gameId}`;

    const ws = new WebSocket(wsUrl);
    connection.ws = ws;

    ws.onopen = () => {
      console.log(`[WebSocketManager] ✓ WebSocket connected: ${gameId}`);
      connection.isConnected = true;
      connection.isConnecting = false;
      connection.connectionStatus = 'connected';
      connection.reconnectAttempts = 0; // 成功時にリセット
      connection.errorMessage = null;

      connection.subscribers.forEach(subscriber => {
        subscriber.setIsConnected?.(true);
        subscriber.setConnectionStatus?.(connection.connectionStatus);
        subscriber.setReconnectAttempts?.(connection.reconnectAttempts);
        subscriber.setErrorMessage?.(connection.errorMessage);
        subscriber.onConnected?.();
      });
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: GameMessage = JSON.parse(event.data);
        console.log(`[WebSocketManager] ← Received:`, message.type);

        // 受信アニメーションをトリガー
        this._triggerReceivingAnimation(gameId);

        connection.subscribers.forEach(subscriber => {
          subscriber.onMessage?.(message);
        });
      } catch (error) {
        console.error(`[WebSocketManager] Message parse error:`, error);
      }
    };

    ws.onclose = (event: CloseEvent) => {
      console.log(`[WebSocketManager] ✗ WebSocket closed: ${gameId}, code: ${event.code}, reason: ${event.reason}`);
      connection.isConnected = false;
      connection.isConnecting = false;
      connection.connectionStatus = 'disconnected';

      connection.subscribers.forEach(subscriber => {
        subscriber.setIsConnected?.(false);
        subscriber.setConnectionStatus?.(connection.connectionStatus);
        subscriber.onDisconnected?.();
      });

      // 正常な切断 (1000) やアンマウント済みの場合は再接続しない
      if (event.code === 1000 || connection.didUnmount) {
        console.log(`[WebSocketManager] No reconnection needed (code: ${event.code}, unmounted: ${connection.didUnmount})`);
        return;
      }

      // 最大再接続回数に達した場合は停止
      if (connection.reconnectAttempts >= connection.maxReconnectAttempts) {
        console.warn(`[WebSocketManager] Max reconnect attempts reached for ${gameId}`);
        connection.connectionStatus = 'error';
        connection.errorMessage = '最大再接続回数に達しました';

        connection.subscribers.forEach(subscriber => {
          subscriber.setConnectionStatus?.(connection.connectionStatus);
          subscriber.setErrorMessage?.(connection.errorMessage);
          subscriber.onError?.(new Event('MaxReconnectAttemptsReached'));
        });
        return;
      }

      // 指数バックオフで再接続をスケジュール
      if (this.connections.has(gameId) && connection.subscribers.size > 0 && !connection.didUnmount) {
        const backoffMs = Math.min(Math.pow(2, connection.reconnectAttempts) * 1000, 10000);
        console.log(`[WebSocketManager] Scheduling reconnection #${connection.reconnectAttempts + 1} for ${gameId} in ${backoffMs}ms`);

        connection.reconnectTimeout = window.setTimeout(() => {
          connection.reconnectTimeout = null;
          connection.reconnectAttempts++;

          if (this.connections.has(gameId) && connection.subscribers.size > 0 && !connection.didUnmount) {
            this._createWebSocket(gameId);
          }
        }, backoffMs);
      }
    };

    ws.onerror = (event: Event) => {
      console.error(`[WebSocketManager] ⚠ WebSocket error: ${gameId}`, event);
      connection.isConnecting = false;
      connection.connectionStatus = 'error';
      connection.errorMessage = 'WebSocket接続エラーが発生しました';

      connection.subscribers.forEach(subscriber => {
        subscriber.setConnectionStatus?.(connection.connectionStatus);
        subscriber.setErrorMessage?.(connection.errorMessage);
        subscriber.onError?.(event);
      });
    };
  }

  private _closeConnection(gameId: string, removeFromMap = true) {
    console.log(`[WebSocketManager] Closing connection: ${gameId}`);
    const connection = this.connections.get(gameId);
    if (!connection) return;

    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout);
      connection.reconnectTimeout = null;
    }

    // アニメーションタイマーをクリア
    if (connection.sendingAnimationTimeout) {
      clearTimeout(connection.sendingAnimationTimeout);
      connection.sendingAnimationTimeout = null;
    }

    if (connection.receivingAnimationTimeout) {
      clearTimeout(connection.receivingAnimationTimeout);
      connection.receivingAnimationTimeout = null;
    }

    if (connection.ws) {
      // 正常に閉じるため、1000コードで閉じる
      if (connection.ws.readyState === WebSocket.OPEN || connection.ws.readyState === WebSocket.CONNECTING) {
        connection.ws.close(1000, 'Component unmounted');
      }
      connection.ws = null;
    }

    connection.isConnected = false;
    connection.isConnecting = false;

    if (removeFromMap) {
      this.connections.delete(gameId);
    }
  }
}

// グローバルインスタンス
const wsManager = new WebSocketManager();

export function useWebSocket({
  gameId,
  onMessage,
  onConnected,
  onDisconnected,
  onError,
}: UseWebSocketOptions): UseWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sendingData, setSendingData] = useState(false);
  const [receivingData, setReceivingData] = useState(false);
  const callbacksRef = useRef({ onMessage, onConnected, onDisconnected, onError });

  // コールバックを最新に保つ
  callbacksRef.current = { onMessage, onConnected, onDisconnected, onError };

  const wrappedCallbacks = useRef({
    onMessage: (message: GameMessage) => callbacksRef.current.onMessage?.(message),
    onConnected: () => callbacksRef.current.onConnected?.(),
    onDisconnected: () => callbacksRef.current.onDisconnected?.(),
    onError: (error: Event) => callbacksRef.current.onError?.(error),
    setIsConnected,
    setConnectionStatus,
    setReconnectAttempts,
    setErrorMessage,
    setSendingData,
    setReceivingData,
  });

  useEffect(() => {
    if (!gameId) return;

    console.log(`[useWebSocket] 🔌 Connecting to gameId: ${gameId}`);
    wsManager.connect(gameId, wrappedCallbacks.current);

    return () => {
      console.log(`[useWebSocket] 🔌 Disconnecting from gameId: ${gameId}`);
      wsManager.disconnect(gameId, wrappedCallbacks.current);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setReconnectAttempts(0);
      setErrorMessage(null);
      setSendingData(false);
      setReceivingData(false);
    };
  }, [gameId]);

  const sendAction = useCallback((action: GameAction): boolean => {
    return wsManager.sendAction(gameId, action);
  }, [gameId]);

  const reconnect = useCallback(() => {
    console.log(`[useWebSocket] 🔄 Manual reconnect for: ${gameId}`);
    wsManager.reconnect(gameId);
  }, [gameId]);

  return {
    sendAction,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts: 10, // WebSocketManagerから取得するのが理想的だが、現状は定数として設定
    errorMessage,
    sendingData,
    receivingData,
    reconnect,
  };
}
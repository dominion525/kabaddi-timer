import { useEffect, useRef, useCallback } from 'preact/hooks';
import type { GameAction, GameMessage, MESSAGE_TYPES } from '../../types/game';

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
  reconnect: () => void;
}

// グローバルWebSocket管理（シングルトンパターン）
class WebSocketManager {
  private connections: Map<string, {
    ws: WebSocket | null;
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    subscribers: Set<{
      onMessage?: (message: GameMessage) => void;
      onConnected?: () => void;
      onDisconnected?: () => void;
      onError?: (error: Event) => void;
      setIsConnected?: (connected: boolean) => void;
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

      // 既に接続済みの場合は即座にonConnectedを呼ぶ
      if (connection.isConnected) {
        callbacks.setIsConnected?.(true);
        callbacks.onConnected?.();
      }
      return;
    }

    // 新しい接続を作成
    const connection = {
      ws: null,
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 10,
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

  private _createWebSocket(gameId: string) {
    const connection = this.connections.get(gameId);
    if (!connection || connection.isConnecting || connection.didUnmount) {
      console.log(`[WebSocketManager] Skip create WebSocket: ${gameId} (${connection ? 'connecting/unmounted' : 'no connection'})`);
      return;
    }

    connection.isConnecting = true;
    console.log(`[WebSocketManager] Creating WebSocket for ${gameId} (attempt ${connection.reconnectAttempts + 1})`);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${gameId}`;

    const ws = new WebSocket(wsUrl);
    connection.ws = ws;

    ws.onopen = () => {
      console.log(`[WebSocketManager] ✓ WebSocket connected: ${gameId}`);
      connection.isConnected = true;
      connection.isConnecting = false;
      connection.reconnectAttempts = 0; // 成功時にリセット

      connection.subscribers.forEach(subscriber => {
        subscriber.setIsConnected?.(true);
        subscriber.onConnected?.();
      });
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: GameMessage = JSON.parse(event.data);
        console.log(`[WebSocketManager] ← Received:`, message.type);

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

      connection.subscribers.forEach(subscriber => {
        subscriber.setIsConnected?.(false);
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
        connection.subscribers.forEach(subscriber => {
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

      connection.subscribers.forEach(subscriber => {
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
  const isConnectedRef = useRef(false);
  const callbacksRef = useRef({ onMessage, onConnected, onDisconnected, onError });

  // コールバックを最新に保つ
  callbacksRef.current = { onMessage, onConnected, onDisconnected, onError };

  const setIsConnected = useCallback((connected: boolean) => {
    isConnectedRef.current = connected;
  }, []);

  const wrappedCallbacks = useRef({
    onMessage: (message: GameMessage) => callbacksRef.current.onMessage?.(message),
    onConnected: () => callbacksRef.current.onConnected?.(),
    onDisconnected: () => callbacksRef.current.onDisconnected?.(),
    onError: (error: Event) => callbacksRef.current.onError?.(error),
    setIsConnected,
  });

  useEffect(() => {
    if (!gameId) return;

    console.log(`[useWebSocket] 🔌 Connecting to gameId: ${gameId}`);
    wsManager.connect(gameId, wrappedCallbacks.current);

    return () => {
      console.log(`[useWebSocket] 🔌 Disconnecting from gameId: ${gameId}`);
      wsManager.disconnect(gameId, wrappedCallbacks.current);
      setIsConnected(false);
    };
  }, [gameId, setIsConnected]);

  const sendAction = useCallback((action: GameAction): boolean => {
    return wsManager.sendAction(gameId, action);
  }, [gameId]);

  const reconnect = useCallback(() => {
    console.log(`[useWebSocket] 🔄 Manual reconnect for: ${gameId}`);
    wsManager.reconnect(gameId);
  }, [gameId]);

  return {
    sendAction,
    isConnected: isConnectedRef.current,
    reconnect,
  };
}
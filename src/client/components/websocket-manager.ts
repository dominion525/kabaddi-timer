// WebSocket接続管理モジュール
// WebSocket通信の確立、管理、メッセージハンドリングを担当
// 責務の分離により接続管理を独立化

import type {
  WebSocketAPIs,
  WebSocketConstants,
  WebSocketCallbacks,
  WebSocketManager,
  WebSocketMessage,
  ActionMessage
} from './websocket-manager.types';

/**
   * WebSocket接続管理ファクトリー
   * 依存性注入でBrowserAPIsとConstants を受け取る
   * @param apis - ブラウザAPI抽象化オブジェクト
   * @param constants - 定数管理オブジェクト
   * @returns WebSocket管理オブジェクト
   */
  function createWebSocketManager(apis: WebSocketAPIs, constants: WebSocketConstants): WebSocketManager {
    const { MESSAGE_TYPES, WEBSOCKET_STATES, ACTIONS } = constants;
    let ws: WebSocket | null = null;
    let connected = false;
    let serverTimeOffset = 0;
    let timeSyncIntervalId: number | null = null;
    let reconnectTimeoutId: number | null = null;
    let gameId: string | null = null;

    // コールバック関数群
    let callbacks: WebSocketCallbacks = {
      onConnected: () => {},
      onDisconnected: () => {},
      onGameStateReceived: (_data) => {},
      onTimeSyncReceived: (_data) => {},
      onError: (_type: string, _error) => {},
      onActionSent: (_action) => {}
    };

    /**
     * WebSocket接続を確立
     * @param id - ゲームID
     * @param callbackHandlers - イベントハンドラー
     */
    function connect(id: string, callbackHandlers: WebSocketCallbacks = {}) {
      gameId = id;
      callbacks = { ...callbacks, ...callbackHandlers };

      // 既存の再接続タイマーをクリア（重複防止）
      if (reconnectTimeoutId) {
        apis.timer.clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
      }

      // 既存の接続をクリーンアップ
      if (ws) {
        apis.websocket.close(ws);
        ws = null;
      }

      const protocol = apis.window.location.getProtocol() === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${apis.window.location.getHost()}/ws/${gameId}`;
      ws = apis.websocket.create(wsUrl);

      ws!.onopen = () => {
        connected = true;
        apis.console.log('WebSocket connected');
        callbacks.onConnected?.();
        // 接続成功時に初期時刻同期を要求
        sendTimeSync();
      };

      ws!.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          apis.console.error('WebSocket message parse error:', err);
          callbacks.onError?.('Message parse error', err);
        }
      };

      ws!.onclose = () => {
        connected = false;
        apis.console.log('WebSocket disconnected');
        callbacks.onDisconnected?.();

        // 既存の再接続タイマーをクリア
        if (reconnectTimeoutId) {
          apis.timer.clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = null;
        }

        // 3秒後に再接続
        reconnectTimeoutId = apis.timer.setTimeout(() => {
          reconnectTimeoutId = null;
          if (gameId) {
            connect(gameId, callbacks);
          }
        }, 3000);
      };

      ws!.onerror = (event: Event) => {
        apis.console.error('WebSocket error:', event);
        connected = false;
        callbacks.onError?.('WebSocket error', event);
      };

      // 定期的な時刻同期を開始（60秒ごと）
      startTimeSyncInterval();
    }

    /**
     * メッセージハンドリング
     * @param message - 受信メッセージ
     */
    function handleMessage(message: WebSocketMessage) {
      if (message.type === MESSAGE_TYPES.GAME_STATE) {
        apis.console.log('Received game state:', message.data);
        callbacks.onGameStateReceived?.(message.data);
      } else if (message.type === MESSAGE_TYPES.ERROR) {
        apis.console.error('Server error:', message.data);
        callbacks.onError?.('Server error', message.data);
      }
    }


    /**
     * アクションを送信
     * @param action - 送信するアクション
     * @returns 送信成功可否
     */
    function sendAction(action: ActionMessage): boolean {
      if (ws && apis.websocket.getReadyState(ws) === WEBSOCKET_STATES.OPEN) {
        try {
          apis.websocket.send(ws, JSON.stringify({ action }));
          apis.console.log('Sent action:', action);
          callbacks.onActionSent?.(action);
          return true;
        } catch (error) {
          apis.console.error('Failed to send action:', error);
          callbacks.onError?.('Action send failed', error);
          return false;
        }
      } else {
        apis.console.warn('WebSocket not connected, action not sent:', action);
        return false;
      }
    }

    /**
     * 時刻同期リクエストを送信
     */
    function sendTimeSync() {
      sendAction({
        type: ACTIONS.TIME_SYNC_REQUEST,
        clientRequestTime: apis.timer.now()
      });
    }

    /**
     * 定期的な時刻同期を開始
     */
    function startTimeSyncInterval() {
      if (timeSyncIntervalId) {
        apis.timer.clearInterval(timeSyncIntervalId);
      }

      timeSyncIntervalId = apis.timer.setInterval(() => {
        if (isConnected()) {
          sendTimeSync();
        }
      }, 60000); // 60秒ごと
    }

    /**
     * 接続状態を取得
     * @returns 接続中の場合true
     */
    function isConnected(): boolean {
      return connected && ws !== null && apis.websocket.getReadyState(ws) === WEBSOCKET_STATES.OPEN;
    }

    /**
     * サーバー時刻オフセットを取得
     * @returns オフセット（ミリ秒）
     */
    function getServerTimeOffset(): number {
      return serverTimeOffset;
    }

    /**
     * 手動で再接続を実行
     */
    function reconnect() {
      // 既存の自動再接続をキャンセル
      if (reconnectTimeoutId) {
        apis.timer.clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
      }

      if (gameId) {
        connect(gameId, callbacks);
      }
    }

    /**
     * リソースのクリーンアップ
     */
    function cleanup() {
      // 時刻同期インターバルをクリア
      if (timeSyncIntervalId) {
        apis.timer.clearInterval(timeSyncIntervalId);
        timeSyncIntervalId = null;
      }

      // 再接続タイマーをクリア
      if (reconnectTimeoutId) {
        apis.timer.clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
      }

      // WebSocket接続をクローズ
      if (ws) {
        apis.websocket.close(ws);
        ws = null;
      }

      connected = false;
      gameId = null;
      serverTimeOffset = 0;
    }

    /**
     * デバッグ情報を取得
     * @returns 接続状態の詳細情報
     */
    function getDebugInfo() {
      return {
        connected: connected,
        gameId: gameId,
        serverTimeOffset: serverTimeOffset,
        wsReadyState: ws ? apis.websocket.getReadyState(ws) : null,
        hasTimeSyncInterval: !!timeSyncIntervalId,
        hasReconnectTimeout: !!reconnectTimeoutId
      };
    }

    // 公開API
    return {
      // 基本機能
      connect,
      sendAction,
      reconnect,
      cleanup,

      // 状態取得
      isConnected,
      getServerTimeOffset,

      // デバッグ
      getDebugInfo
    };
  }

// グローバル関数として利用可能にする
(window as any).createWebSocketManager = createWebSocketManager;
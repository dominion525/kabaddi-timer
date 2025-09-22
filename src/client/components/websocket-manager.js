// WebSocket接続管理モジュール
// WebSocket通信の確立、管理、メッセージハンドリングを担当
// 責務の分離により接続管理を独立化

(function(global) {
  'use strict';

  /**
   * WebSocket接続管理ファクトリー
   * 依存性注入でBrowserAPIsとConstants を受け取る
   * @param {Object} apis - ブラウザAPI抽象化オブジェクト
   * @param {Object} constants - 定数管理オブジェクト
   * @returns {Object} WebSocket管理オブジェクト
   */
  function createWebSocketManager(apis, constants) {
    const { MESSAGE_TYPES, WEBSOCKET_STATES } = constants;

    let ws = null;
    let connected = false;
    let serverTimeOffset = 0;
    let timeSyncIntervalId = null;
    let reconnectTimeoutId = null;
    let gameId = null;

    // コールバック関数群
    let callbacks = {
      onConnected: () => {},
      onDisconnected: () => {},
      onGameStateReceived: () => {},
      onTimeSyncReceived: () => {},
      onError: () => {},
      onActionSent: () => {}
    };

    /**
     * WebSocket接続を確立
     * @param {string} id - ゲームID
     * @param {Object} callbackHandlers - イベントハンドラー
     */
    function connect(id, callbackHandlers = {}) {
      gameId = id;
      callbacks = { ...callbacks, ...callbackHandlers };

      // 既存の接続をクリーンアップ
      if (ws) {
        apis.websocket.close(ws);
        ws = null;
      }

      const protocol = apis.window.location.getProtocol() === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${apis.window.location.getHost()}/ws/${gameId}`;

      ws = apis.websocket.create(wsUrl);

      ws.onopen = () => {
        connected = true;
        apis.console.log('WebSocket connected');
        callbacks.onConnected();

        // 接続成功時に初期時刻同期を要求
        sendTimeSync();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          apis.console.error('WebSocket message parse error:', error);
          callbacks.onError('Message parse error', error);
        }
      };

      ws.onclose = () => {
        connected = false;
        apis.console.log('WebSocket disconnected');
        callbacks.onDisconnected();

        // 既存の再接続タイマーをクリア
        if (reconnectTimeoutId) {
          apis.timer.clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = null;
        }

        // 3秒後に再接続
        reconnectTimeoutId = apis.timer.setTimeout(() => {
          if (gameId) {
            connect(gameId, callbacks);
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        apis.console.error('WebSocket error:', error);
        connected = false;
        callbacks.onError('WebSocket error', error);
      };

      // 定期的な時刻同期を開始（60秒ごと）
      startTimeSyncInterval();
    }

    /**
     * メッセージハンドリング
     * @param {Object} message - 受信メッセージ
     */
    function handleMessage(message) {
      if (message.type === MESSAGE_TYPES.GAME_STATE) {
        apis.console.log('Received game state:', message.data);
        callbacks.onGameStateReceived(message.data);
      }
      else if (message.type === MESSAGE_TYPES.TIME_SYNC_RESPONSE) {
        handleTimeSync(message.data);
      }
      else if (message.type === MESSAGE_TYPES.ERROR) {
        apis.console.error('Server error:', message.data);
        callbacks.onError('Server error', message.data);
      }
    }

    /**
     * 時刻同期処理
     * @param {Object} data - 時刻同期データ
     */
    function handleTimeSync(data) {
      const clientTime = apis.timer.now();
      const serverTime = data.serverTime;
      const rtt = data.clientRequestTime ?
        (clientTime - data.clientRequestTime) : 0;
      serverTimeOffset = serverTime - clientTime + (rtt / 2);

      apis.console.log('Time sync: offset =', serverTimeOffset, 'ms, RTT =', rtt, 'ms');
      callbacks.onTimeSyncReceived({
        offset: serverTimeOffset,
        rtt: rtt,
        serverTime: serverTime,
        clientTime: clientTime
      });
    }

    /**
     * アクションを送信
     * @param {Object} action - 送信するアクション
     * @returns {boolean} 送信成功可否
     */
    function sendAction(action) {
      if (ws && apis.websocket.getReadyState(ws) === WEBSOCKET_STATES.OPEN) {
        try {
          apis.websocket.send(ws, JSON.stringify({ action }));
          apis.console.log('Sent action:', action);
          callbacks.onActionSent(action);
          return true;
        } catch (error) {
          apis.console.error('Failed to send action:', error);
          callbacks.onError('Action send failed', error);
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
        type: 'TIME_SYNC_REQUEST',
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
     * @returns {boolean} 接続中の場合true
     */
    function isConnected() {
      return connected && ws && apis.websocket.getReadyState(ws) === WEBSOCKET_STATES.OPEN;
    }

    /**
     * サーバー時刻オフセットを取得
     * @returns {number} オフセット（ミリ秒）
     */
    function getServerTimeOffset() {
      return serverTimeOffset;
    }

    /**
     * 手動で再接続を実行
     */
    function reconnect() {
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
     * @returns {Object} 接続状態の詳細情報
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
      connect: connect,
      sendAction: sendAction,
      reconnect: reconnect,
      cleanup: cleanup,

      // 状態取得
      isConnected: isConnected,
      getServerTimeOffset: getServerTimeOffset,

      // デバッグ
      getDebugInfo: getDebugInfo
    };
  }

  // グローバルに公開
  global.createWebSocketManager = createWebSocketManager;

  // CommonJS対応
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createWebSocketManager };
  }

})(typeof window !== 'undefined' ? window : global);
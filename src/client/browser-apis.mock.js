// テスト用モック - BrowserAPIs
// クライアントサイドコードの単体テストを可能にする

(function(global) {
  'use strict';

  /**
   * BrowserAPIsのモック実装
   * 実際のブラウザAPIをシミュレートし、テスト時に動作を制御可能にする
   */
  const MockBrowserAPIs = {
    // テストモードフラグ
    _isTestMode: true,

    // モック状態の管理
    _mockState: {
      websockets: new Map(), // WebSocketインスタンス管理
      storage: new Map(),    // ローカルストレージシミュレーション
      timers: new Map(),     // タイマーID管理
      console: [],           // コンソール出力ログ
      time: Date.now(),      // モック時刻
      mediaQueries: new Map() // メディアクエリ結果
    },

    // WebSocket関連モックAPI
    websocket: {
      create: function(url) {
        const mockWs = {
          url: url,
          readyState: 0, // CONNECTING
          onopen: null,
          onmessage: null,
          onclose: null,
          onerror: null,
          _messages: [], // 送信されたメッセージのログ

          send: function(data) {
            this._messages.push(data);
            // テスト用のイベント発火メソッドを追加
          },

          close: function() {
            this.readyState = 3; // CLOSED
            if (this.onclose) {
              setTimeout(() => this.onclose({ type: 'close' }), 0);
            }
          },

          // テスト用ヘルパーメソッド
          _simulateOpen: function() {
            this.readyState = 1; // OPEN
            if (this.onopen) {
              setTimeout(() => this.onopen({ type: 'open' }), 0);
            }
          },

          _simulateMessage: function(data) {
            if (this.onmessage) {
              setTimeout(() => this.onmessage({
                type: 'message',
                data: typeof data === 'string' ? data : JSON.stringify(data)
              }), 0);
            }
          },

          _simulateError: function(error) {
            if (this.onerror) {
              setTimeout(() => this.onerror({ type: 'error', error }), 0);
            }
          }
        };

        MockBrowserAPIs._mockState.websockets.set(url, mockWs);
        return mockWs;
      },

      send: function(ws, data) {
        return ws.send(data);
      },

      close: function(ws) {
        return ws.close();
      },

      getReadyState: function(ws) {
        return ws.readyState;
      },

      // WebSocket定数
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    },

    // ローカルストレージモックAPI
    storage: {
      get: function(key) {
        return MockBrowserAPIs._mockState.storage.get(key) || null;
      },

      set: function(key, value) {
        MockBrowserAPIs._mockState.storage.set(key, value);
      },

      remove: function(key) {
        MockBrowserAPIs._mockState.storage.delete(key);
      },

      // テスト用ヘルパー
      _clear: function() {
        MockBrowserAPIs._mockState.storage.clear();
      },

      _getAll: function() {
        return Object.fromEntries(MockBrowserAPIs._mockState.storage);
      }
    },

    // タイマー関連モックAPI
    timer: {
      _nextId: 1,

      requestAnimationFrame: function(callback) {
        const id = MockBrowserAPIs.timer._nextId++;
        MockBrowserAPIs._mockState.timers.set(id, {
          type: 'animation',
          callback: callback,
          timestamp: MockBrowserAPIs._mockState.time
        });
        // 即座に実行（テスト用）
        setTimeout(() => {
          if (MockBrowserAPIs._mockState.timers.has(id)) {
            callback(MockBrowserAPIs._mockState.time);
          }
        }, 0);
        return id;
      },

      cancelAnimationFrame: function(id) {
        MockBrowserAPIs._mockState.timers.delete(id);
      },

      setTimeout: function(callback, delay) {
        const id = MockBrowserAPIs.timer._nextId++;
        MockBrowserAPIs._mockState.timers.set(id, {
          type: 'timeout',
          callback: callback,
          delay: delay,
          timestamp: MockBrowserAPIs._mockState.time
        });
        // テスト用即座実行オプション
        if (MockBrowserAPIs._fastTimers) {
          setTimeout(callback, 0);
        }
        return id;
      },

      clearTimeout: function(id) {
        MockBrowserAPIs._mockState.timers.delete(id);
      },

      setInterval: function(callback, interval) {
        const id = MockBrowserAPIs.timer._nextId++;
        MockBrowserAPIs._mockState.timers.set(id, {
          type: 'interval',
          callback: callback,
          interval: interval,
          timestamp: MockBrowserAPIs._mockState.time
        });
        return id;
      },

      clearInterval: function(id) {
        MockBrowserAPIs._mockState.timers.delete(id);
      },

      now: function() {
        return MockBrowserAPIs._mockState.time;
      },

      // テスト用ヘルパー
      _setTime: function(time) {
        MockBrowserAPIs._mockState.time = time;
      },

      _advance: function(ms) {
        MockBrowserAPIs._mockState.time += ms;
      },

      _clearAll: function() {
        MockBrowserAPIs._mockState.timers.clear();
      }
    },

    // Window/DOM関連モックAPI
    window: {
      location: {
        getProtocol: function() {
          return 'https:';
        },

        getHost: function() {
          return 'localhost:8787';
        },

        getHref: function() {
          return 'https://localhost:8787/game/test';
        }
      },

      matchMedia: function(query) {
        const mockMediaQuery = {
          matches: MockBrowserAPIs._mockState.mediaQueries.get(query) || false,
          media: query,
          addListener: function(callback) {
            // リスナー登録をシミュレート
          }
        };
        return mockMediaQuery;
      },

      // テスト用ヘルパー
      _setMediaQuery: function(query, matches) {
        MockBrowserAPIs._mockState.mediaQueries.set(query, matches);
      }
    },

    // コンソール出力モックAPI
    console: {
      log: function(...args) {
        MockBrowserAPIs._mockState.console.push({
          type: 'log',
          args: args,
          timestamp: MockBrowserAPIs._mockState.time
        });
      },

      error: function(...args) {
        MockBrowserAPIs._mockState.console.push({
          type: 'error',
          args: args,
          timestamp: MockBrowserAPIs._mockState.time
        });
      },

      warn: function(...args) {
        MockBrowserAPIs._mockState.console.push({
          type: 'warn',
          args: args,
          timestamp: MockBrowserAPIs._mockState.time
        });
      },

      // テスト用ヘルパー
      _getLogs: function(type) {
        if (type) {
          return MockBrowserAPIs._mockState.console.filter(log => log.type === type);
        }
        return [...MockBrowserAPIs._mockState.console];
      },

      _clear: function() {
        MockBrowserAPIs._mockState.console = [];
      }
    },

    // グローバルテスト設定
    _fastTimers: false, // タイマーを即座に実行するかどうか

    // モック状態のリセット
    _reset: function() {
      MockBrowserAPIs._mockState = {
        websockets: new Map(),
        storage: new Map(),
        timers: new Map(),
        console: [],
        time: Date.now(),
        mediaQueries: new Map()
      };
      MockBrowserAPIs._fastTimers = false;
    },

    // テスト支援メソッド
    _enableFastTimers: function() {
      MockBrowserAPIs._fastTimers = true;
    },

    _disableFastTimers: function() {
      MockBrowserAPIs._fastTimers = false;
    }
  };

  // グローバルに公開
  global.MockBrowserAPIs = MockBrowserAPIs;

  // テスト環境では自動的にBrowserAPIsを置き換え
  if (typeof global.BrowserAPIs === 'undefined') {
    global.BrowserAPIs = MockBrowserAPIs;
  }

})(typeof window !== 'undefined' ? window : global);
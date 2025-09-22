// ブラウザAPI依存性ラッパー
// テスト時にモック可能な構造でブラウザAPIを抽象化

(function(global: any) {
  'use strict';

  /**
   * ブラウザAPI群をラップする純粋なサービスオブジェクト
   * 既存コードへの影響を最小化しつつ、テスト時の依存性注入を可能にする
   */
  const BrowserAPIs = {

    // WebSocket関連API
    websocket: {
      /**
       * WebSocket接続を作成
       * @param {string} url - WebSocket URL
       * @returns {WebSocket} WebSocketインスタンス
       */
      create: function(url: string): WebSocket {
        return new WebSocket(url);
      },

      /**
       * WebSocketでデータを送信
       * @param {WebSocket} ws - WebSocketインスタンス
       * @param {string} data - 送信データ
       */
      send: function(ws: WebSocket, data: string): void {
        return ws.send(data);
      },

      /**
       * WebSocket接続を閉じる
       * @param {WebSocket} ws - WebSocketインスタンス
       */
      close: function(ws: WebSocket): void {
        return ws.close();
      },

      /**
       * WebSocketの接続状態を取得
       * @param {WebSocket} ws - WebSocketインスタンス
       * @returns {number} 接続状態
       */
      getReadyState: function(ws: WebSocket): number {
        return ws.readyState;
      },

      // WebSocket定数
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    },

    // ローカルストレージ関連API
    storage: {
      /**
       * ローカルストレージから値を取得
       * @param {string} key - キー
       * @returns {string|null} 保存された値
       */
      get: function(key: string): string | null {
        return localStorage.getItem(key);
      },

      /**
       * ローカルストレージに値を保存
       * @param {string} key - キー
       * @param {string} value - 値
       */
      set: function(key: string, value: string): void {
        return localStorage.setItem(key, value);
      },

      /**
       * ローカルストレージから値を削除
       * @param {string} key - キー
       */
      remove: function(key: string): void {
        return localStorage.removeItem(key);
      }
    },

    // タイマー関連API
    timer: {
      /**
       * アニメーションフレームを要求
       * @param {Function} callback - コールバック関数
       * @returns {number} リクエストID
       */
      requestAnimationFrame: function(callback: FrameRequestCallback): number {
        return requestAnimationFrame(callback);
      },

      /**
       * アニメーションフレーム要求をキャンセル
       * @param {number} id - リクエストID
       */
      cancelAnimationFrame: function(id: number): void {
        return cancelAnimationFrame(id);
      },

      /**
       * タイムアウト設定
       * @param {Function} callback - コールバック関数
       * @param {number} delay - 遅延時間（ミリ秒）
       * @returns {number} タイマーID
       */
      setTimeout: function(callback: () => void, delay: number): number {
        return setTimeout(callback, delay) as any;
      },

      /**
       * タイムアウトをクリア
       * @param {number} id - タイマーID
       */
      clearTimeout: function(id: number): void {
        return clearTimeout(id);
      },

      /**
       * インターバル設定
       * @param {Function} callback - コールバック関数
       * @param {number} interval - インターバル時間（ミリ秒）
       * @returns {number} タイマーID
       */
      setInterval: function(callback: () => void, interval: number): number {
        return setInterval(callback, interval) as any;
      },

      /**
       * インターバルをクリア
       * @param {number} id - タイマーID
       */
      clearInterval: function(id: number): void {
        return clearInterval(id);
      },

      /**
       * 現在時刻を取得
       * @returns {number} 現在時刻（ミリ秒）
       */
      now: function(): number {
        return Date.now();
      }
    },

    // Window/DOM関連API
    window: {
      location: {
        /**
         * 現在のプロトコルを取得
         * @returns {string} プロトコル（'http:' または 'https:'）
         */
        getProtocol: function(): string {
          return window.location.protocol;
        },

        /**
         * 現在のホストを取得
         * @returns {string} ホスト名:ポート
         */
        getHost: function(): string {
          return window.location.host;
        },

        /**
         * 現在のURLを取得
         * @returns {string} 完全なURL
         */
        getHref: function(): string {
          return window.location.href;
        }
      },

      /**
       * メディアクエリマッチャーを作成
       * @param {string} query - メディアクエリ文字列
       * @returns {MediaQueryList} MediaQueryListオブジェクト
       */
      matchMedia: function(query: string): MediaQueryList {
        return window.matchMedia(query);
      }
    },

    // DOM関連API
    dom: {
      /**
       * 要素をIDで取得
       * @param {string} id - 要素ID
       * @returns {Element|null} DOM要素
       */
      getElementById: function(id: string): HTMLElement | null {
        return document.getElementById(id);
      },

      /**
       * 要素を作成
       * @param {string} tagName - タグ名
       * @returns {Element} 作成された要素
       */
      createElement: function(tagName: string): HTMLElement {
        return document.createElement(tagName);
      }
    },

    // コンソール出力API
    console: {
      /**
       * ログ出力
       * @param {...any} args - 出力する値
       */
      log: function(...args: any[]): void {
        return console.log(...args);
      },

      /**
       * エラー出力
       * @param {...any} args - 出力する値
       */
      error: function(...args: any[]): void {
        return console.error(...args);
      },

      /**
       * 警告出力
       * @param {...any} args - 出力する値
       */
      warn: function(...args: any[]): void {
        return console.warn(...args);
      }
    },

    // ナビゲーター関連API
    navigator: {
      clipboard: {
        /**
         * クリップボードにテキストを書き込む
         * @param {string} text - コピーするテキスト
         * @returns {Promise} 書き込み結果のPromise
         */
        writeText: function(text: string): Promise<void> {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
          }
          // フォールバック処理
          return Promise.reject(new Error('Clipboard API not available'));
        }
      }
    },

    // アラート・確認ダイアログAPI
    dialog: {
      /**
       * アラートダイアログを表示
       * @param {string} message - メッセージ
       */
      alert: function(message: string): void {
        return alert(message);
      },

      /**
       * 確認ダイアログを表示
       * @param {string} message - メッセージ
       * @returns {boolean} ユーザーの選択結果
       */
      confirm: function(message: string): boolean {
        return confirm(message);
      }
    }
  };

  // グローバルに公開
  global.BrowserAPIs = BrowserAPIs;

})(window);
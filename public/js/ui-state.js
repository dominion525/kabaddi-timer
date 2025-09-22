"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uiStateScript = void 0;
// ui-state.jsの内容を読み込んでエクスポート
exports.uiStateScript = `
// UI状態管理モジュール
// 表示状態を管理する純粋関数群
// ゲームロジックから独立したUI層の管理

(function(global) {
  'use strict';

  /**
   * UI状態管理のファクトリー関数
   * 依存性注入に対応し、テスタブルな設計
   * @param {Object} apis - ブラウザAPI抽象化オブジェクト
   * @returns {Object} UI状態管理オブジェクト
   */
  function createUIState(apis) {
    // ローカルストレージキー
    const STORAGE_KEY = 'kabaddi-timer-simple-mode';

    // 内部状態
    let state = {
      showControlPanel: false,
      showStatusBar: true,
      simpleMode: false,
      isDesktop: false
    };

    // メディアクエリの監視
    let mediaQueryListener = null;

    /**
     * 初期化処理
     * localStorageからの設定読み込みとメディアクエリ監視の開始
     */
    function initialize() {
      // simpleModeをlocalStorageから読み込み
      const savedSimpleMode = apis.storage.get(STORAGE_KEY);
      if (savedSimpleMode !== null) {
        try {
          state.simpleMode = JSON.parse(savedSimpleMode);
        } catch (error) {
          // 不正な値の場合はデフォルト値を使用
          apis.console.warn('Failed to parse saved simpleMode:', error);
          state.simpleMode = false;
        }
      }

      // メディアクエリ監視の開始
      startMediaQueryMonitoring();
    }

    /**
     * メディアクエリ監視の開始
     * デスクトップ表示判定を動的に更新
     */
    function startMediaQueryMonitoring() {
      const mediaQuery = apis.window.matchMedia('(min-width: 768px)');

      // 初期値設定
      state.isDesktop = mediaQuery.matches;

      // 変更監視
      mediaQueryListener = (e) => {
        state.isDesktop = e.matches;
      };

      mediaQuery.addListener(mediaQueryListener);
    }

    /**
     * コントロールパネル表示の切り替え
     * @returns {boolean} 新しい表示状態
     */
    function toggleControlPanel() {
      state.showControlPanel = !state.showControlPanel;
      return state.showControlPanel;
    }

    /**
     * ステータスバー表示の切り替え
     * @returns {boolean} 新しい表示状態
     */
    function toggleStatusBar() {
      state.showStatusBar = !state.showStatusBar;
      return state.showStatusBar;
    }

    /**
     * シンプルモードの切り替え
     * 設定をlocalStorageに永続化
     * @returns {boolean} 新しいシンプルモード状態
     */
    function toggleSimpleMode() {
      state.simpleMode = !state.simpleMode;

      // localStorageに保存
      try {
        apis.storage.set(STORAGE_KEY, JSON.stringify(state.simpleMode));
      } catch (error) {
        apis.console.error('Failed to save simpleMode to localStorage:', error);
      }

      return state.simpleMode;
    }

    /**
     * 現在の状態を取得
     * @returns {Object} 現在のUI状態のコピー
     */
    function getState() {
      return {
        showControlPanel: state.showControlPanel,
        showStatusBar: state.showStatusBar,
        simpleMode: state.simpleMode,
        isDesktop: state.isDesktop
      };
    }

    /**
     * 特定の状態値を取得
     * @param {string} key - 状態のキー名
     * @returns {*} 指定された状態の値
     */
    function get(key) {
      return state[key];
    }

    /**
     * 状態を直接設定（テスト用）
     * @param {string} key - 設定するキー
     * @param {*} value - 設定する値
     */
    function setState(key, value) {
      if (key in state) {
        state[key] = value;
      } else {
        apis.console.warn('Unknown UI state key:', key);
      }
    }

    /**
     * クリーンアップ処理
     * メモリリーク防止のためのリソース解放
     */
    function cleanup() {
      if (mediaQueryListener) {
        // メディアクエリリスナーの削除
        // 注意: removeListenerは実際のブラウザAPIでは利用可能だが、
        // 現在の抽象化レイヤーには含まれていないため、
        // 実装時にapis.window.removeMediaQueryListenerとして追加が必要
        mediaQueryListener = null;
      }
    }

    /**
     * デバッグ用の状態ダンプ
     * @returns {Object} 現在の内部状態
     */
    function debug() {
      return {
        state: getState(),
        storageKey: STORAGE_KEY,
        hasMediaQueryListener: !!mediaQueryListener
      };
    }

    // 公開API
    return {
      // 初期化・クリーンアップ
      initialize,
      cleanup,

      // 状態操作
      toggleControlPanel,
      toggleStatusBar,
      toggleSimpleMode,

      // 状態取得
      getState,
      get,

      // テスト・デバッグ用
      setState,
      debug
    };
  }

  // グローバルに公開
  global.createUIState = createUIState;

  // CommonJS対応
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createUIState };
  }

})(typeof window !== 'undefined' ? window : global);
`;

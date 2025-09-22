// 定数管理モジュール
// アプリケーション全体で使用する定数を一元管理
// Single Source of Truthによる保守性とバグ防止

(function(global) {
  'use strict';

  /**
   * アプリケーションのデフォルト値
   * ゲーム初期化、リセット時の基準値として使用
   */
  const DEFAULT_VALUES = {
    // チーム関連のデフォルト値
    teamNames: {
      teamA: 'チームA',
      teamB: 'チームB'
    },

    // タイマー関連のデフォルト値
    timer: {
      defaultDuration: 900, // 15分（秒単位）
      presetMinutes: {
        short: 3,   // 短時間：3分
        medium: 15, // 中時間：15分（標準）
        long: 20    // 長時間：20分
      }
    },

    // スコア関連のデフォルト値
    score: 0,
    doOrDieCount: 0,

    // サブタイマーのデフォルト値
    subTimer: {
      defaultDuration: 30 // 30秒
    }
  };

  /**
   * アクションタイプの定数
   * サーバーとの通信で使用するアクション種別
   */
  const ACTIONS = {
    // タイマー操作
    TIMER_START: { type: 'TIMER_START' },
    TIMER_PAUSE: { type: 'TIMER_PAUSE' },
    TIMER_RESET: { type: 'TIMER_RESET' },
    TIMER_SET: 'TIMER_SET',
    TIMER_ADJUST: 'TIMER_ADJUST',

    // サブタイマー操作
    SUB_TIMER_START: 'SUB_TIMER_START',
    SUB_TIMER_PAUSE: 'SUB_TIMER_PAUSE',
    SUB_TIMER_RESET: 'SUB_TIMER_RESET',

    // スコア操作
    SCORE_UPDATE: 'SCORE_UPDATE',
    RESET_SCORES: { type: 'RESET_SCORES' },

    // Do or Die 操作
    DO_OR_DIE_UPDATE: 'DO_OR_DIE_UPDATE',
    DO_OR_DIE_RESET: { type: 'DO_OR_DIE_RESET' },

    // チーム操作
    SET_TEAM_NAME: 'SET_TEAM_NAME',
    COURT_CHANGE: 'COURT_CHANGE',

    // 全体操作
    RESET_ALL: 'RESET_ALL',

    // 同期操作
    TIME_SYNC_REQUEST: 'TIME_SYNC_REQUEST'
  };

  /**
   * WebSocket接続状態の定数
   * BrowserAPIs.websocketで使用される状態値
   */
  const WEBSOCKET_STATES = {
    CONNECTING: 0, // 接続中
    OPEN: 1,       // 接続済み
    CLOSING: 2,    // 切断中
    CLOSED: 3      // 切断済み
  };

  /**
   * メッセージタイプの定数
   * WebSocketで送受信されるメッセージの種別
   */
  const MESSAGE_TYPES = {
    // 受信メッセージ
    GAME_STATE: 'game_state',
    TIME_SYNC_RESPONSE: 'time_sync_response',
    ERROR: 'error',

    // 送信メッセージ
    ACTION: 'action'
  };

  /**
   * バリデーション用の定数
   * 入力値検証で使用する制限値
   */
  const VALIDATION_CONSTRAINTS = {
    timer: {
      minutes: { min: 0, max: 999 },
      seconds: { min: 0, max: 59 },
      minTotalSeconds: 1 // 最低1秒は必要
    },
    teamName: {
      maxLength: 20,
      pattern: /^[^\s].*[^\s]$|^[^\s]$/ // 先頭末尾空白文字なし
    },
    score: {
      min: 0,
      max: 999
    },
    doOrDie: {
      min: 0,
      max: 3 // 最大3回
    }
  };

  /**
   * UI表示用の定数
   * 表示形式やラベルなどの定数
   */
  const UI_CONSTANTS = {
    timerFormat: {
      separator: ':',
      minDigits: 2
    },
    doOrDieIndicators: {
      maxCount: 3
    },
    responsiveBreakpoints: {
      desktop: '(min-width: 768px)'
    }
  };

  /**
   * ローカルストレージキーの定数
   * 設定値永続化に使用するキー名
   */
  const STORAGE_KEYS = {
    simpleMode: 'kabaddi-timer-simple-mode',
    gameSettings: 'kabaddi-timer-game-settings'
  };

  /**
   * アクションタイプのバリデーション
   * 有効なアクションタイプかどうかを判定
   * @param {string} actionType - チェックするアクションタイプ
   * @returns {boolean} 有効なアクションタイプの場合true
   */
  function isValidActionType(actionType) {
    const validTypes = Object.values(ACTIONS).map(action =>
      typeof action === 'object' ? action.type : action
    );
    return validTypes.includes(actionType);
  }

  /**
   * WebSocket状態の文字列表現を取得
   * @param {number} state - WebSocket状態値
   * @returns {string} 状態の文字列表現
   */
  function getWebSocketStateString(state) {
    const stateMap = {
      [WEBSOCKET_STATES.CONNECTING]: 'CONNECTING',
      [WEBSOCKET_STATES.OPEN]: 'OPEN',
      [WEBSOCKET_STATES.CLOSING]: 'CLOSING',
      [WEBSOCKET_STATES.CLOSED]: 'CLOSED'
    };
    return stateMap[state] || 'UNKNOWN';
  }

  /**
   * プリセットの表示名を取得
   * @param {string} presetKey - プリセットキー
   * @returns {string} 表示名
   */
  function getPresetDisplayName(presetKey) {
    const minutes = DEFAULT_VALUES.timer.presetMinutes[presetKey];
    return minutes ? `${minutes}分` : '不明';
  }

  /**
   * 定数の整合性をチェック
   * 開発時のデバッグ用
   * @returns {Object} チェック結果
   */
  function validateConstants() {
    const issues = [];

    // プリセット値の整合性チェック
    Object.entries(DEFAULT_VALUES.timer.presetMinutes).forEach(([key, value]) => {
      if (typeof value !== 'number' || value <= 0) {
        issues.push(`Invalid preset value for ${key}: ${value}`);
      }
    });

    // アクションタイプの重複チェック
    const actionTypes = Object.values(ACTIONS).map(action =>
      typeof action === 'object' ? action.type : action
    );
    const uniqueTypes = new Set(actionTypes);
    if (actionTypes.length !== uniqueTypes.size) {
      issues.push('Duplicate action types detected');
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  // 公開API
  const Constants = {
    // 定数オブジェクト
    DEFAULT_VALUES,
    ACTIONS,
    WEBSOCKET_STATES,
    MESSAGE_TYPES,
    VALIDATION_CONSTRAINTS,
    UI_CONSTANTS,
    STORAGE_KEYS,

    // ユーティリティ関数
    isValidActionType,
    getWebSocketStateString,
    getPresetDisplayName,
    validateConstants
  };

  // グローバルに公開
  global.Constants = Constants;

  // CommonJS対応
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Constants;
  }

})(typeof window !== 'undefined' ? window : global);